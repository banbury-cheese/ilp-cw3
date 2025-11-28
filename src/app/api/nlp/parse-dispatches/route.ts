import { NextRequest, NextResponse } from 'next/server';
import { callLLM, DISPATCH_PARSE_SYSTEM_PROMPT } from '@/lib/llm';
import { ParseDispatchesRequest, DispatchParseResult } from '@/types';
import { geocodeAddress } from '@/lib/geocoding';

export async function POST(request: NextRequest) {
  try {
    const body: ParseDispatchesRequest = await request.json();
    const { inputText, defaultDate, defaultTime, idBase } = body;

    if (!inputText || inputText.trim().length === 0) {
      return NextResponse.json(
        { error: 'INPUT_REQUIRED', details: 'Input text is required' },
        { status: 400 }
      );
    }

    // Build the user prompt with context
    const today = defaultDate || new Date().toISOString().split('T')[0];
    const time = defaultTime || '14:00';
    const startId = idBase || Date.now() % 10000;

    const userPrompt = `Parse the following delivery instruction into MedDispatchRec JSON objects.

Context:
- defaultDate (for "today"): ${today}
- defaultTime: ${time}
- idBase (starting ID): ${startId}

User instruction:
"${inputText}"

Remember: Respond with ONLY the JSON object, no additional text.`;

    // Call LLM
    const llmResponse = await callLLM(userPrompt, DISPATCH_PARSE_SYSTEM_PROMPT);

    // Parse the JSON response
    let result: DispatchParseResult;
    try {
      // Try to extract JSON from the response (in case there's any extra text)
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

    // Add warning if no dispatches were generated
    if (result.dispatches.length === 0 && result.warnings.length === 0) {
      result.warnings.push('Could not infer any deliveries from this text.');
    }

    // Automatically geocode any locations with 0,0 coordinates
    const geocodingPromises = result.dispatches.map(async (dispatch) => {
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
    console.error('Error in parse-dispatches:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
