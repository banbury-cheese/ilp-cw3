import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocoding';

/**
 * POST /api/geocoding/forward
 * Geocode an address to lat/lng coordinates
 * Body: { address: string }
 * Response: { lat: number, lng: number, formattedAddress: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return NextResponse.json(
        { error: 'ADDRESS_REQUIRED', details: 'Address is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address.trim());

    return NextResponse.json({
      lat: result.lat,
      lng: result.lng,
      formattedAddress: result.formattedAddress
    });

  } catch (error) {
    console.error('Geocoding error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a configuration error
    if (errorMessage.includes('API key is not configured')) {
      return NextResponse.json(
        { error: 'GEOCODING_NOT_CONFIGURED', details: 'Google Maps API is not configured on the server' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'GEOCODING_FAILED', details: errorMessage },
      { status: 500 }
    );
  }
}
