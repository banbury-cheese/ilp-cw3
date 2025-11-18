'use client';

import { useEffect, useState } from 'react';
import { GeoJsonLineString, ServicePoint, RestrictedArea } from '@/types';

// Service points in Edinburgh
const servicePoints: ServicePoint[] = [
  {
    name: 'Appleton Tower',
    lng: -3.1863580789,
    lat: 55.9446806671,
    type: 'pickup'
  },
  {
    name: 'Ocean Terminal',
    lng: -3.18,
    lat: 55.982,
    type: 'pickup'
  }
];

// Restricted areas (example - adjust coordinates as needed)
const restrictedAreas: RestrictedArea[] = [
  {
    name: 'Edinburgh Castle',
    coordinates: [
      [-3.202, 55.9485],
      [-3.198, 55.9485],
      [-3.198, 55.9465],
      [-3.202, 55.9465],
      [-3.202, 55.9485]
    ]
  },
  {
    name: 'Holyrood Park',
    coordinates: [
      [-3.18, 55.955],
      [-3.155, 55.955],
      [-3.155, 55.94],
      [-3.18, 55.94],
      [-3.18, 55.955]
    ]
  }
];

interface MapViewProps {
  geojson: GeoJsonLineString | null;
  deliveryPoints?: { lng: number; lat: number; id: number }[];
  showServicePoints?: boolean;
  showRestrictedAreas?: boolean;
}

export default function MapView({
  geojson,
  deliveryPoints = [],
  showServicePoints = true,
  showRestrictedAreas = true
}: MapViewProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<unknown> | null>(null);

  useEffect(() => {
    // Dynamically import Leaflet components to avoid SSR issues
    import('react-leaflet').then((L) => {
      import('leaflet').then((leaflet) => {
        // Fix default marker icons
        delete (leaflet.default.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        const { MapContainer, TileLayer, Polyline, Marker, Popup, Polygon } = L;

        const Map = () => (
          <MapContainer
            center={[55.945, -3.19]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="rounded-xl"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Service points */}
            {showServicePoints &&
              servicePoints.map((point) => (
                <Marker key={point.name} position={[point.lat, point.lng]}>
                  <Popup>
                    <strong>{point.name}</strong>
                    <br />
                    <span className="text-gray-500">{point.type}</span>
                  </Popup>
                </Marker>
              ))}

            {/* Delivery points */}
            {deliveryPoints.map((point) => (
              <Marker key={point.id} position={[point.lat, point.lng]}>
                <Popup>
                  <strong>Delivery #{point.id}</strong>
                </Popup>
              </Marker>
            ))}

            {/* Restricted areas */}
            {showRestrictedAreas &&
              restrictedAreas.map((area) => (
                <Polygon
                  key={area.name}
                  positions={area.coordinates.map(([lng, lat]) => [lat, lng])}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.2
                  }}
                >
                  <Popup>{area.name} (Restricted)</Popup>
                </Polygon>
              ))}

            {/* Route polyline */}
            {geojson && geojson.coordinates.length > 0 && (
              <Polyline
                positions={geojson.coordinates.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: '#6366f1',
                  weight: 3,
                  opacity: 0.8
                }}
              />
            )}
          </MapContainer>
        );

        setMapComponent(() => Map);
      });
    });
  }, [geojson, deliveryPoints, showServicePoints, showRestrictedAreas]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Route Map</h2>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {showServicePoints && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Service Points
            </span>
          )}
          {showRestrictedAreas && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Restricted
            </span>
          )}
          {geojson && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              Route
            </span>
          )}
        </div>
      </div>

      <div className="h-[400px] rounded-xl overflow-hidden bg-gray-100">
        {MapComponent ? (
          <MapComponent />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <svg
              className="animate-spin h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
