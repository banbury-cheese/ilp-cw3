import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import { DispatchParseResult } from '@/types';

const PRESCRIPTION_SYSTEM_PROMPT = `You are an AI assistant that converts medical prescriptions into structured MedDispatchRec JSON objects for a drone-based medicine delivery system (ILP).

You MUST respond with JSON only, no extra text before or after the JSON object.

## Output Format

{
  "dispatches": [
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
      "delivery": {
        "lng": <longitude>,
        "lat": <latitude>
      }
    }
  ],
  "notes": ["<informational notes about interpretation>"],
  "warnings": ["<warnings about ambiguities or issues>"]
}

## Location Mapping

Use these coordinates for known locations in Edinburgh:
- "Royal Infirmary" / "Edinburgh Royal Infirmary" / "ERI" → lng: -3.177, lat: 55.940
- "Western General Hospital" / "WGH" → lng: -3.235, lat: 55.963
- "St John's Hospital" → lng: -3.519, lat: 55.895
- "Sick Kids" / "Royal Hospital for Sick Children" / "RHSC" → lng: -3.212, lat: 55.922
- "Appleton Tower" → lng: -3.1863580789, lat: 55.9446806671
- "Ocean Terminal" → lng: -3.18, lat: 55.982
- "George Square" → lng: -3.189, lat: 55.9437
- "Lauriston Place" → lng: -3.194, lat: 55.9438
- "Little France" → lng: -3.136, lat: 55.921

If a location is not in this list, set delivery to null and add a warning: "Unknown delivery address '<location>'; coordinates must be set manually."

## Prescription Parsing Rules

### Capacity (Weight/Volume)
Convert prescription quantities to capacity in kg:
- Liquids: 1ml ≈ 0.001kg, 1L = 1kg
- Tablets/capsules: estimate ~0.01kg per 100 units
- "500ml IV bag" → 0.5kg
- "2x 500ml bags" → 1.0kg
- "1L saline" → 1.0kg
- "100 tablets" → 0.01kg
- Multiple items going to same destination: sum the weights
- Add a small buffer for packaging (~10%)

### Temperature Requirements
- **Cooling = true** if any of:
  - "refrigerated", "cold chain", "keep chilled"
  - "store at 2-8°C", "cold storage"
  - Common refrigerated meds: insulin, vaccines, biologics, some antibiotics

- **Heating = true** if any of:
  - "keep warm", "heated infusion"
  - "warm blood products"

- Default: both false

### Timing
- "STAT" or "urgent" → use defaultTime or current time
- "morning" → 09:00
- "afternoon" → 14:00
- "evening" → 18:00
- "ASAP" → use defaultTime
- Specific times like "14:00" or "2pm" → use directly
- No time specified → use defaultTime

### Grouping
- Group items that can travel together into a single dispatch when:
  - Same destination
  - Similar delivery time
  - Compatible temperature requirements (both cooling, both heating, or neither)
- Split into separate dispatches when:
  - Different destinations
  - Conflicting temperature requirements
  - Different time windows

### Common Prescription Elements to Extract
- Patient location/ward (map to coordinates)
- Medication names (for notes, not used in dispatch)
- Quantities and units (convert to capacity)
- Storage requirements (map to cooling/heating)
- Urgency/timing requirements

## Important
- Always provide reasonable defaults rather than failing
- Add notes explaining your interpretations (e.g., "Interpreted 'Ward 5 RIE' as Royal Infirmary")
- Add warnings for any approximations or issues
- If text is too vague to create any dispatch, return empty dispatches array with a warning
- Never set both cooling AND heating to true for same dispatch`;

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
