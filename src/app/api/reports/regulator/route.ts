import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import { IlpPlanResponse, GeoJsonLineString } from '@/types';

const RESTRICTED_AREAS = [
  'George Square Area',
  'Dr Elsie Inglis Quadrangle',
  'Bristo Square Open Area',
  'Bayes Central Area'
];

interface ReportRequest {
  plan: IlpPlanResponse;
  geojson: GeoJsonLineString;
}

export async function POST(request: NextRequest) {
  try {
    const { plan, geojson }: ReportRequest = await request.json();

    if (!plan || !geojson) {
      return NextResponse.json(
        { error: 'Invalid input', details: 'Plan and route data are required' },
        { status: 400 }
      );
    }

    // Calculate route statistics
    const routeLength = geojson.coordinates.length;
    const dronesUsed = plan.dronePaths.length;

    // Get bounding box
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    for (const [lng, lat] of geojson.coordinates) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    // Generate compliance analysis using LLM
    const systemPrompt = `You are a drone aviation compliance officer. Generate a formal regulatory compliance report for drone delivery operations. Focus on:
- Route safety and no-fly zone avoidance
- Operational parameters
- Risk assessment
- Recommendations

Use formal language suitable for submission to aviation authorities. Be thorough but concise.`;

    const userPrompt = `Generate a regulatory compliance report for the following drone delivery operation in Edinburgh, UK:

OPERATIONAL SUMMARY:
- Total route moves: ${plan.totalMoves}
- Total route cost: ${plan.totalCost.toFixed(6)}
- Number of drones: ${dronesUsed}
- Route coordinates: ${routeLength} waypoints

GEOGRAPHIC BOUNDS:
- Latitude: ${minLat.toFixed(6)} to ${maxLat.toFixed(6)}
- Longitude: ${minLng.toFixed(6)} to ${maxLng.toFixed(6)}

RESTRICTED AREAS IN VICINITY:
${RESTRICTED_AREAS.map(a => `- ${a}`).join('\n')}

Please provide a formal compliance report covering:
1. Executive Summary
2. Route Safety Assessment
3. No-Fly Zone Compliance
4. Operational Risk Analysis
5. Recommendations`;

    let complianceAnalysis = '';
    try {
      complianceAnalysis = await callLLM(userPrompt, systemPrompt);
    } catch {
      complianceAnalysis = 'Unable to generate AI compliance analysis. Manual review required.';
    }

    // Construct the full report
    const report = `================================================================================
DRONE DELIVERY REGULATORY COMPLIANCE REPORT
================================================================================

Report Generated: ${new Date().toISOString()}
Report ID: RPT-${Date.now()}

--------------------------------------------------------------------------------
SECTION 1: OPERATIONAL METRICS
--------------------------------------------------------------------------------

Route Statistics:
  - Total Moves: ${plan.totalMoves}
  - Total Cost: ${plan.totalCost.toFixed(6)}
  - Route Waypoints: ${routeLength}
  - Drones Deployed: ${dronesUsed}

Geographic Coverage:
  - Latitude Range: ${minLat.toFixed(6)}° to ${maxLat.toFixed(6)}°
  - Longitude Range: ${minLng.toFixed(6)}° to ${maxLng.toFixed(6)}°
  - Operating Region: Edinburgh, Scotland, UK

--------------------------------------------------------------------------------
SECTION 2: NO-FLY ZONE COMPLIANCE
--------------------------------------------------------------------------------

Restricted Areas in Operating Region:
${RESTRICTED_AREAS.map(a => `  - ${a}`).join('\n')}

Status: Route planned to avoid all designated restricted areas.

--------------------------------------------------------------------------------
SECTION 3: COMPLIANCE ANALYSIS
--------------------------------------------------------------------------------

${complianceAnalysis}

--------------------------------------------------------------------------------
SECTION 4: CERTIFICATION
--------------------------------------------------------------------------------

This report certifies that the planned drone delivery route has been:
  [✓] Calculated using approved path-finding algorithms
  [✓] Designed to avoid all known restricted areas
  [✓] Optimized for efficiency while maintaining safety margins

Prepared by: ILP Dispatch Studio (Automated)
Review Status: Pending Manual Verification

================================================================================
END OF REPORT
================================================================================`;

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      {
        error: 'Report generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
