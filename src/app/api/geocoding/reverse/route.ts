import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geocoding';

/**
 * POST /api/geocoding/reverse
 * Reverse geocode lat/lng coordinates to an address
 * Body: { lat: number, lng: number }
 * Response: { address: string, formattedAddress: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'INVALID_COORDINATES', details: 'Latitude and longitude must be numbers' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'INVALID_LATITUDE', details: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'INVALID_LONGITUDE', details: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    const result = await reverseGeocode(lat, lng);

    return NextResponse.json({
      address: result.address,
      formattedAddress: result.formattedAddress
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a configuration error
    if (errorMessage.includes('API key is not configured')) {
      return NextResponse.json(
        { error: 'GEOCODING_NOT_CONFIGURED', details: 'Google Maps API is not configured on the server' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'REVERSE_GEOCODING_FAILED', details: errorMessage },
      { status: 500 }
    );
  }
}
