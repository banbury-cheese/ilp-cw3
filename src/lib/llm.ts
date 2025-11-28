// LLM utility for calling OpenAI-compatible APIs

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callLLM(
  prompt: string,
  systemInstructions?: string
): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'gpt-4.1';

  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable is not set');
  }

  const messages: LLMMessage[] = [];

  if (systemInstructions) {
    messages.push({
      role: 'system',
      content: systemInstructions
    });
  }

  messages.push({
    role: 'user',
    content: prompt
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// System prompt for parsing natural language into dispatches
export const DISPATCH_PARSE_SYSTEM_PROMPT = `You are an AI assistant that converts natural language delivery instructions into structured MedDispatchRec JSON objects for a drone-based medicine delivery system.

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
        "lat": <latitude>,
        "address": <string>
      }
    }
  ],
  "notes": ["<informational notes about interpretation>"],
  "warnings": ["<warnings about ambiguities or approximations>"]
}

## Location Mapping

Use these coordinates for known locations in Edinburgh:
- "Royal Infirmary" / "Edinburgh Royal Infirmary" / "ERI" / "RIE" → lng: -3.177, lat: 55.940, address: "Royal Infirmary of Edinburgh"
- "Western General Hospital" / "WGH" → lng: -3.235, lat: 55.963, address: "Western General Hospital"
- "St John's Hospital" → lng: -3.519, lat: 55.895, address: "St John's Hospital, Livingston"
- "Sick Kids" / "Royal Hospital for Sick Children" / "RHSC" → lng: -3.212, lat: 55.922, address: "Royal Hospital for Children & Young People"
- "Marchmont" → lng: -3.198, lat: 55.935, address: "Marchmont, Edinburgh"
- "Appleton Tower" → lng: -3.1863580789, lat: 55.9446806671, address: "Appleton Tower, Edinburgh"
- "Ocean Terminal" → lng: -3.18, lat: 55.982, address: "Ocean Terminal, Edinburgh"
- "George Square" → lng: -3.189, lat: 55.9437, address: "George Square, Edinburgh"
- "Waverley Station" → lng: -3.190, lat: 55.952, address: "Waverley Station, Edinburgh"
- "Edinburgh Airport" → lng: -3.3725, lat: 55.9508, address: "Edinburgh Airport"

If a location is not in this list:
- set "lng": 0, "lat": 0
- set "address" to the location name as written in the text
- add a note: "Location '<location>' will be geocoded automatically"

IMPORTANT: NEVER set delivery to null. Always provide an address field, even if coordinates are unknown (set to 0).

## Parsing Rules

### Dates
- "today" → use the defaultDate provided
- "tomorrow" → add 1 day to defaultDate
- "next Monday/Tuesday/etc" → calculate from defaultDate
- If no date mentioned → use defaultDate

### Times
- "around 2pm" → "14:00"
- "between 2 and 3pm" → "14:30" (middle of interval)
- "morning" → "09:00"
- "afternoon" → "14:00"
- "evening" → "18:00"
- If no time mentioned → use defaultTime

### Capacity
- Extract numbers with units: "2kg" → 2.0, "500g" → 0.5, "750ml" → 0.75
- Multiple items: sum their weights
- If no weight mentioned but items are: estimate reasonably (e.g., "insulin pen" → 0.1kg)

### Temperature Requirements
- Cooling if: "needs cooling", "refrigerated", "cold chain", "keep cold", "chilled"
- Heating if: "keep warm", "heated", "warm"
- Default: both false
- If both are somehow implied, choose the more dominant one and add a warning

### Cost
- "under £50" or "max £50" → maxCost: 50
- If not mentioned → omit maxCost field

### Multiple Deliveries
- If the text describes multiple deliveries, create multiple dispatch objects
- Assign sequential IDs starting from idBase

## Important
- Always provide reasonable defaults rather than failing
- Add notes explaining your interpretations
- Add warnings for any approximations or ambiguities
- If text is too vague to create any dispatch, return empty dispatches array with a warning`;
