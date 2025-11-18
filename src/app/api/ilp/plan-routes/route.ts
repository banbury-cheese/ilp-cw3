import { NextRequest, NextResponse } from 'next/server';
import { MedDispatchRec, IlpPlanResponse, GeoJsonLineString, PlanRoutesResponse } from '@/types';
import { validateDispatches, formatValidationErrors } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const dispatches: MedDispatchRec[] = await request.json();

    // Validate input
    const errors = validateDispatches(dispatches);
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          details: formatValidationErrors(errors)
        },
        { status: 400 }
      );
    }

    // Get ILP base URL
    const ilpBaseUrl = process.env.ILP_BASE_URL;
    if (!ilpBaseUrl) {
      return NextResponse.json(
        { error: 'CONFIG_ERROR', details: 'ILP_BASE_URL not configured' },
        { status: 500 }
      );
    }

    const requestBody = JSON.stringify(dispatches);

    // Call both ILP endpoints in parallel
    const [planResponse, geojsonResponse] = await Promise.all([
      fetch(`${ilpBaseUrl}/calcDeliveryPath`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      }),
      fetch(`${ilpBaseUrl}/calcDeliveryPathAsGeoJson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      })
    ]);

    // Check for errors
    if (!planResponse.ok) {
      const errorText = await planResponse.text();
      console.error('ILP calcDeliveryPath error:', planResponse.status, errorText);
      return NextResponse.json(
        {
          error: 'ILP_BACKEND_ERROR',
          details: `calcDeliveryPath returned ${planResponse.status}: ${errorText}`
        },
        { status: 502 }
      );
    }

    if (!geojsonResponse.ok) {
      const errorText = await geojsonResponse.text();
      console.error('ILP calcDeliveryPathAsGeoJson error:', geojsonResponse.status, errorText);
      return NextResponse.json(
        {
          error: 'ILP_BACKEND_ERROR',
          details: `calcDeliveryPathAsGeoJson returned ${geojsonResponse.status}: ${errorText}`
        },
        { status: 502 }
      );
    }

    const plan: IlpPlanResponse = await planResponse.json();
    const geojson: GeoJsonLineString = await geojsonResponse.json();

    const result: PlanRoutesResponse = {
      plan,
      geojson
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in plan-routes:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
