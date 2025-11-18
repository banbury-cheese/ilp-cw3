import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import { MedDispatchRec, IlpPlanResponse } from '@/types';

// Drone capabilities for context
const DRONE_INFO = {
  '1': { name: 'Alpha', capacity: 3.0, cooling: true, heating: false, costPerMove: 0.5, costInitial: 2.0 },
  '2': { name: 'Beta', capacity: 2.5, cooling: false, heating: true, costPerMove: 0.4, costInitial: 1.5 },
  '3': { name: 'Gamma', capacity: 2.0, cooling: true, heating: true, costPerMove: 0.6, costInitial: 2.5 },
  '4': { name: 'Delta', capacity: 4.0, cooling: false, heating: false, costPerMove: 0.3, costInitial: 1.0 },
  '5': { name: 'Epsilon', capacity: 1.5, cooling: true, heating: false, costPerMove: 0.4, costInitial: 1.5 },
  '6': { name: 'Zeta', capacity: 3.5, cooling: false, heating: true, costPerMove: 0.5, costInitial: 2.0 },
  '7': { name: 'Eta', capacity: 2.0, cooling: true, heating: false, costPerMove: 0.35, costInitial: 1.2 },
  '8': { name: 'Theta', capacity: 2.5, cooling: false, heating: false, costPerMove: 0.3, costInitial: 1.0 },
  '9': { name: 'Iota', capacity: 3.0, cooling: true, heating: true, costPerMove: 0.7, costInitial: 3.0 }
};

function getSystemPrompt(mode: string): string {
  const baseContext = `You are an AI assistant that explains drone delivery route plans for the ILP (Intelligent Logistics Platform) medical delivery system.

## Context

ILP delivers prepared medical orders by drone from service points (like Appleton Tower) to delivery points (hospitals, clinics).

Key concepts:
- **Drones** have capabilities: capacity (kg), cooling, heating
- **Drones** have costs: costInitial (startup), costPerMove (per step)
- **Routes** use fixed step lengths and 16 discrete compass directions
- **Restricted areas** are no-fly zones that routes must avoid (George Square Area, Dr Elsie Inglis Quadrangle, Bristo Square, Bayes Central Area)
- **Total cost** = sum of (costInitial + moves × costPerMove) for each drone used

## Drone Fleet

Available drones and their specifications:
${Object.entries(DRONE_INFO).map(([id, info]) =>
  `- Drone ${id} (${info.name}): ${info.capacity}kg capacity, ${info.cooling ? 'cooling' : 'no cooling'}, ${info.heating ? 'heating' : 'no heating'}, £${info.costPerMove}/move, £${info.costInitial} initial`
).join('\n')}

## Your Task

Explain WHY the planner made specific choices. Cover:

1. **Plan Overview**: Total deliveries, drones used, cost, moves
2. **Drone Selection**: Why each drone was chosen
   - Capacity vs required load
   - Temperature requirements matching
   - Cost efficiency
3. **Route Characteristics**: Any notable routing decisions
4. **Trade-offs**: Alternative choices that could have been made`;

  const modeInstructions = {
    dispatcher: `

## Tone: Dispatcher

Focus on operational details:
- Specific assignments: which drone flies where
- Capacity utilization
- Time efficiency
- Practical considerations for loading/dispatch
- Keep it concise and actionable`,

    manager: `

## Tone: Manager

Focus on business metrics:
- Cost breakdown and efficiency
- Resource utilization
- High-level justification of choices
- ROI considerations
- Comparison to alternatives`,

    regulator: `

## Tone: Regulator

Focus on compliance and safety:
- Restricted area avoidance
- Capacity limits respected
- Temperature requirements met
- Reliability of route planning
- Safety margins`
  };

  return baseContext + (modeInstructions[mode as keyof typeof modeInstructions] || modeInstructions.dispatcher);
}

interface ExplainPlanRequest {
  dispatches: MedDispatchRec[];
  plan: IlpPlanResponse;
  explanationMode?: 'dispatcher' | 'manager' | 'regulator';
}

export async function POST(request: NextRequest) {
  try {
    const body: ExplainPlanRequest = await request.json();
    const { dispatches, plan, explanationMode = 'dispatcher' } = body;

    if (!dispatches || dispatches.length === 0) {
      return NextResponse.json(
        { error: 'DISPATCHES_REQUIRED', details: 'Dispatches array is required' },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'PLAN_REQUIRED', details: 'Plan object is required' },
        { status: 400 }
      );
    }

    // Build context for LLM
    const dispatchSummary = dispatches.map(d => ({
      id: d.id,
      date: d.date,
      time: d.time,
      capacity: d.requirements.capacity,
      cooling: d.requirements.cooling || false,
      heating: d.requirements.heating || false,
      location: `(${d.delivery.lng.toFixed(4)}, ${d.delivery.lat.toFixed(4)})`
    }));

    const planSummary = {
      totalCost: plan.totalCost,
      totalMoves: plan.totalMoves,
      dronesUsed: plan.dronePaths.map(dp => ({
        droneId: dp.droneId,
        droneInfo: DRONE_INFO[dp.droneId as keyof typeof DRONE_INFO] || { name: `Drone ${dp.droneId}`, capacity: 2.0 },
        deliveryCount: dp.deliveries.length,
        deliveryIds: dp.deliveries.map(d => d.deliveryId)
      }))
    };

    const userPrompt = `Explain the following ILP delivery plan.

## Dispatches to Deliver
${JSON.stringify(dispatchSummary, null, 2)}

## Generated Plan
${JSON.stringify(planSummary, null, 2)}

Provide a clear, well-structured explanation of why this plan was generated and the choices made. Use paragraphs and bullet points where appropriate for readability.`;

    // Call LLM
    const systemPrompt = getSystemPrompt(explanationMode);
    const explanation = await callLLM(userPrompt, systemPrompt);

    return NextResponse.json({ explanation });

  } catch (error) {
    console.error('Error generating explanation:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
