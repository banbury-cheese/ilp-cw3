import { NextRequest, NextResponse } from 'next/server';
import { MedDispatchRec } from '@/types';
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

    // Call ILP backend
    const response = await fetch(`${ilpBaseUrl}/queryAvailableDrones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dispatches)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ILP backend error:', response.status, errorText);
      return NextResponse.json(
        {
          error: 'ILP_BACKEND_ERROR',
          details: `ILP returned ${response.status}: ${errorText}`
        },
        { status: 502 }
      );
    }

    const drones: string[] = await response.json();

    return NextResponse.json({ drones });

  } catch (error) {
    console.error('Error in query-available-drones:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
