import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input', details: 'Prescription text is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a pharmaceutical analyst AI. Your task is to analyze prescription text and provide structured insights for a medical drone delivery system.

Analyze the prescription and return a JSON object with the following structure:
{
  "medications": [
    {
      "name": "Medication name",
      "dose": "Dosage information",
      "quantity": "Quantity if specified",
      "temperatureSensitive": true/false,
      "temperatureRequirement": "cooling" | "heating" | null,
      "notes": "Any relevant notes about this medication"
    }
  ],
  "ambiguities": [
    "List of potential ambiguities or missing information"
  ],
  "warnings": [
    "Important warnings or flags about the prescription"
  ],
  "summary": "A brief 1-2 sentence summary of the prescription"
}

Temperature sensitivity guidelines:
- Insulin, vaccines, biologics, certain antibiotics → require COOLING
- Blood products, some IV solutions → may require temperature control
- Standard tablets, capsules → typically no temperature requirements

Flag ambiguities such as:
- Missing delivery time
- Missing or unclear address
- Multiple addresses mentioned
- Unclear medication quantities
- Conflicting instructions

Only return valid JSON, no additional text.`;

    const userPrompt = `Analyze this prescription text:

${text}`;

    const response = await callLLM(userPrompt, systemPrompt);

    // Parse the LLM response
    let insights;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // If parsing fails, return a structured error response
      return NextResponse.json({
        medications: [],
        ambiguities: ['Unable to fully parse prescription'],
        warnings: ['AI analysis encountered an error - please review manually'],
        summary: 'Analysis incomplete'
      });
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Prescription analysis error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
