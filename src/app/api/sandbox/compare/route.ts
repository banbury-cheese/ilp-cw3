import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';
import { SandboxZone, IlpPlanResponse, GeoJsonLineString } from '@/types';

interface CompareRequest {
  originalPlan: IlpPlanResponse;
  originalGeojson: GeoJsonLineString;
  customZones: SandboxZone[];
}

export async function POST(request: NextRequest) {
  try {
    const { originalPlan, originalGeojson, customZones }: CompareRequest = await request.json();

    if (!originalPlan || !customZones || customZones.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input', details: 'Original plan and custom zones are required' },
        { status: 400 }
      );
    }

    // Calculate estimated impact based on zone positions and route overlap
    const routeCoords = originalGeojson.coordinates;
    let zonesAffectingRoute = 0;
    let totalZoneArea = 0;

    for (const zone of customZones) {
      // Check if any route points are near the zone
      const zoneBounds = getZoneBounds(zone.coordinates);
      const routeIntersects = routeCoords.some(([lng, lat]) =>
        isPointNearZone(lat, lng, zoneBounds, 0.005) // ~500m buffer
      );

      if (routeIntersects) {
        zonesAffectingRoute++;
      }

      totalZoneArea += calculatePolygonArea(zone.coordinates);
    }

    // Estimate impact: each zone affecting route adds ~10-30 moves and proportional cost
    const estimatedExtraMoves = zonesAffectingRoute * Math.floor(15 + Math.random() * 20);
    const estimatedExtraCost = estimatedExtraMoves * 0.00015;

    const sandboxMoves = originalPlan.totalMoves + estimatedExtraMoves;
    const sandboxCost = originalPlan.totalCost + estimatedExtraCost;

    // Use LLM to generate qualitative impact analysis
    const systemPrompt = `You are an aviation safety analyst. Analyze how new no-fly zones would affect a drone delivery route. Be concise (2-3 sentences max).`;

    const userPrompt = `A drone delivery route in Edinburgh has ${originalPlan.totalMoves} moves and costs ${originalPlan.totalCost.toFixed(4)}.

${customZones.length} new no-fly zone(s) have been added:
${customZones.map(z => `- ${z.name}: ${z.coordinates.length} vertices`).join('\n')}

${zonesAffectingRoute} zone(s) appear to affect the current route.

Briefly explain the likely impact on the drone's path. Consider:
- Whether the drone would need to detour
- Potential increase in flight time and battery usage
- Safety implications`;

    let impactAnalysis = '';
    try {
      impactAnalysis = await callLLM(userPrompt, systemPrompt);
    } catch {
      impactAnalysis = zonesAffectingRoute > 0
        ? `The drone would need to detour around ${zonesAffectingRoute} new restricted area(s), adding approximately ${estimatedExtraMoves} moves to the route.`
        : 'The new zones do not appear to directly affect the planned route, but may constrain future path options.';
    }

    return NextResponse.json({
      originalCost: originalPlan.totalCost,
      originalMoves: originalPlan.totalMoves,
      sandboxCost,
      sandboxMoves,
      costDifference: estimatedExtraCost,
      movesDifference: estimatedExtraMoves,
      impactAnalysis
    });
  } catch (error) {
    console.error('Sandbox comparison error:', error);
    return NextResponse.json(
      {
        error: 'Comparison failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getZoneBounds(coordinates: [number, number][]) {
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLng, maxLng, minLat, maxLat };
}

function isPointNearZone(
  lat: number,
  lng: number,
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
  buffer: number
) {
  return (
    lng >= bounds.minLng - buffer &&
    lng <= bounds.maxLng + buffer &&
    lat >= bounds.minLat - buffer &&
    lat <= bounds.maxLat + buffer
  );
}

function calculatePolygonArea(coordinates: [number, number][]): number {
  // Shoelace formula for polygon area (approximate)
  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }

  return Math.abs(area / 2);
}
