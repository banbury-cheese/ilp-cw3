// Google Maps Geocoding API integration

export interface GeocodingResult {
  address: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface ReverseGeocodingResult {
  address: string;
  formattedAddress: string;
}

/**
 * Geocode an address to lat/lng coordinates using Google Maps Geocoding API
 * @param address The address or location name to geocode
 * @returns The geocoding result with coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY environment variable.');
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding API request failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'OK') {
    if (data.status === 'ZERO_RESULTS') {
      throw new Error(`No results found for address: "${address}"`);
    }
    throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  if (!data.results || data.results.length === 0) {
    throw new Error(`No results found for address: "${address}"`);
  }

  const result = data.results[0];
  const location = result.geometry.location;

  return {
    address,
    lat: location.lat,
    lng: location.lng,
    formattedAddress: result.formatted_address
  };
}

/**
 * Reverse geocode lat/lng coordinates to an address using Google Maps Geocoding API
 * @param lat Latitude
 * @param lng Longitude
 * @returns The reverse geocoding result with address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY environment variable.');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Reverse geocoding API request failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'OK') {
    if (data.status === 'ZERO_RESULTS') {
      throw new Error(`No address found for coordinates: ${lat}, ${lng}`);
    }
    throw new Error(`Reverse geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  if (!data.results || data.results.length === 0) {
    throw new Error(`No address found for coordinates: ${lat}, ${lng}`);
  }

  const result = data.results[0];

  return {
    address: result.formatted_address,
    formattedAddress: result.formatted_address
  };
}
