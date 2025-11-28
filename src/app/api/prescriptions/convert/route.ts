import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import { DispatchParseResult } from '@/types';
import { geocodeAddress } from '@/lib/geocoding';

const PRESCRIPTION_SYSTEM_PROMPT = `You are an AI assistant that converts medical prescription/free-text requests into structured MedDispatchRec JSON objects for a drone-based medicine delivery system (ILP).

You MUST respond with JSON ONLY (no markdown, no commentary, no code fences). The response must be a single JSON object matching the schema below.

## Required Output Schema (ALWAYS include these top-level keys)

{
  "dispatches": [ ... ],
  "notes": [ ... ],
  "warnings": [ ... ]
}

## MedDispatchRec Schema

Each dispatch in "dispatches" MUST follow:

{
  "id": <integer>,
  "date": "<yyyy-MM-dd>",
  "time": "<HH:mm>",
  "requirements": {
    "capacity": <number in kg>,
    "cooling": <boolean>,
    "heating": <boolean>,
    "maxCost": <optional number>
  },
  "delivery": { "lng": <number>, "lat": <number>, "address": <string> }
}

Rules:
- "delivery" MUST always have an "address" field with the location name/address from the text
- "lng" and "lat" should be set to 0 if unknown (they will be geocoded automatically by the system)
- "address" is REQUIRED: always extract the location/destination name from the text
- "maxCost" is OPTIONAL: omit it entirely if not specified/inferred.

## Reference Defaults

You will be given:
- defaultDate: yyyy-MM-dd (use as the reference for interpreting 'today', 'tomorrow', weekdays)
- defaultTime: HH:mm (use when time cannot be determined)
- idBase: starting integer id (use idBase, idBase+1, ...)

Interpret relative dates using defaultDate as 'today'.

## Location Mapping (Edinburgh)

Use these coordinates if the text matches the location name (case-insensitive, allow abbreviations):

- "Royal Infirmary" / "Edinburgh Royal Infirmary" / "ERI" / "RIE" → lng: -3.177, lat: 55.940, address: "Royal Infirmary of Edinburgh"
- "Western General Hospital" / "WGH" → lng: -3.235, lat: 55.963, address: "Western General Hospital"
- "St John's Hospital" → lng: -3.519, lat: 55.895, address: "St John's Hospital, Livingston"
- "Sick Kids" / "Royal Hospital for Sick Children" / "RHSC" → lng: -3.212, lat: 55.922, address: "Royal Hospital for Children & Young People"
- "Appleton Tower" → lng: -3.1863580789, lat: 55.9446806671, address: "Appleton Tower, Edinburgh"
- "Ocean Terminal" → lng: -3.18, lat: 55.982, address: "Ocean Terminal, Edinburgh"
- "George Square" → lng: -3.189, lat: 55.9437, address: "George Square, Edinburgh"
- "Lauriston Place" → lng: -3.194, lat: 55.9438, address: "Lauriston Place, Edinburgh"
- "Little France" → lng: -3.136, lat: 55.921, address: "Little France, Edinburgh"

If the destination is not in this list:
- set "lng": 0, "lat": 0
- set "address" to the location name as written in the text
- add a note: "Location '<location>' will be geocoded automatically"

IMPORTANT: NEVER set delivery to null. Always provide an address field, even if coordinates are unknown (set to 0).

## Parsing Rules

### A) Capacity (convert to kg)

Goal: produce a reasonable numeric capacity for drone matching.

Use these heuristics:
- Liquids: 1 ml ≈ 0.001 kg (1 L ≈ 1 kg)
- "500ml IV bag" → 0.5 kg
- "2 x 500ml bags" → 1.0 kg
- Solids explicitly in grams/kg: 500 g → 0.5 kg, 2 kg → 2.0 kg
- Tablets/capsules if only counts are given: estimate 0.01 kg per 100 units (rough).
- If multiple items in one dispatch, sum their weights first.

Packaging buffer:
- After summing item weights, multiply by 1.10 (10% buffer) and round to 2 decimal places.
- Mention in notes when you applied the buffer.

### B) Temperature Requirements

Set booleans based on explicit requirements.

Cooling = true if text indicates:
- refrigerated, cold chain, keep chilled, store at 2–8°C, cold storage
- (or strongly implied by meds like insulin/vaccines/biologics ONLY if the text explicitly implies cold storage; do not assume based purely on medication name)

Heating = true if text indicates:
- keep warm, warmed infusion, warm blood products

Default if not mentioned: cooling=false, heating=false.

IMPORTANT constraint:
- Do NOT set BOTH cooling=true and heating=true in the SAME dispatch.
- If both cooling and heating are required for items going to the same destination/time window:
  - split into TWO dispatches with the same date/time/delivery coords:
    - one dispatch with cooling=true, heating=false and capacity equal to the cooling items
    - one dispatch with cooling=false, heating=true and capacity equal to the heating items
  - add notes explaining the split.

Ambient items (no temp requirement):
- If ambient items share destination/time with cooled items, they MAY be included in the cooled dispatch (cooling=true) unless text says otherwise. Note this choice.

### C) Timing

Parse explicit times first:
- "14:30", "2:30pm", "2pm" → convert to HH:mm (24h).
- "between 14:00 and 15:00" / "between 2 and 3pm" → choose the midpoint (e.g., 14:30) and add a note.

If only a part-of-day is given:
- morning → 09:00
- afternoon → 14:00
- evening → 18:00

If urgent/STAT/ASAP and no explicit time:
- use defaultTime and add a note that urgency was mentioned.

If no time info at all:
- use defaultTime and add a note.

### D) Date handling

- If the text says "today": use defaultDate
- If "tomorrow": defaultDate + 1 day
- If a weekday is given (e.g., "next Monday"): choose the next occurrence after defaultDate and add a note.
- If an explicit date appears, use it.

### E) Grouping into dispatches

Create 1+ dispatches depending on destinations and constraints:

Group items into a single dispatch when:
- same destination (same mapped coordinates), and
- same/compatible delivery time (within ~60 minutes), and
- temperature compatibility holds per rules above.

Split dispatches when:
- different destinations, or
- significantly different times/windows, or
- cooling vs heating conflict (split as described).

### F) Notes and warnings

- Use "notes" for interpretation decisions (e.g., defaulted time, midpoint time, buffer applied, split due to cooling/heating).
- Use "warnings" for uncertainties (unknown location, missing required info, OCR ambiguity etc).

### G) If the text is too vague

If you cannot construct any dispatch reliably:
- return:
  { "dispatches": [], "notes": [], "warnings": ["Could not extract any deliveries from this prescription."] }

Remember: output JSON ONLY.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, defaultDate, defaultTime, idBase } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'TEXT_REQUIRED', details: 'Prescription text is required' },
        { status: 400 }
      );
    }

    // Build the user prompt
    const today = defaultDate || new Date().toISOString().split('T')[0];
    const time = defaultTime || '14:00';
    const startId = idBase || Date.now() % 10000;

    const userPrompt = `Parse the following prescription text into MedDispatchRec JSON objects for drone delivery.

Context:
- defaultDate: ${today}
- defaultTime: ${time}
- idBase (starting ID): ${startId}

Prescription text:
"""
${text}
"""

Remember: Respond with ONLY the JSON object, no additional text.`;

    // Call LLM
    const llmResponse = await callLLM(userPrompt, PRESCRIPTION_SYSTEM_PROMPT);

    // Parse the JSON response
    let result: DispatchParseResult;
    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', llmResponse);
      return NextResponse.json(
        {
          error: 'LLM_PARSE_ERROR',
          details: 'Failed to parse LLM response as JSON',
          rawResponse: llmResponse.substring(0, 500)
        },
        { status: 500 }
      );
    }

    // Ensure the result has the expected structure
    if (!result.dispatches) {
      result.dispatches = [];
    }
    if (!result.notes) {
      result.notes = [];
    }
    if (!result.warnings) {
      result.warnings = [];
    }

    // Add source indication
    result.notes.unshift('Converted from prescription upload');

    // Add warning if no dispatches were generated
    if (result.dispatches.length === 0 && result.warnings.length === 0) {
      result.warnings.push('Could not extract any deliveries from this prescription.');
    }

    // Automatically geocode any locations with 0,0 coordinates
    const geocodingPromises = result.dispatches.map(async (dispatch, index) => {
      if (dispatch.delivery.address && (dispatch.delivery.lat === 0 || dispatch.delivery.lng === 0)) {
        try {
          const geocoded = await geocodeAddress(dispatch.delivery.address);
          dispatch.delivery.lat = geocoded.lat;
          dispatch.delivery.lng = geocoded.lng;
          dispatch.delivery.address = geocoded.formattedAddress;
          result.notes.push(`Geocoded location "${dispatch.delivery.address}" to coordinates`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Geocoding failed';
          result.warnings.push(`Could not geocode "${dispatch.delivery.address}": ${errorMessage}`);
          // Keep coordinates as 0,0 if geocoding fails
        }
      }
    });

    // Wait for all geocoding to complete
    await Promise.all(geocodingPromises);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error converting prescription:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
