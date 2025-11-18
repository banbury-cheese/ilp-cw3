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

// Restricted areas from ILP
const restrictedAreas: RestrictedArea[] = [
  {
    name: 'George Square Area',
    coordinates: [
      [-3.19057881832123, 55.9440241257753],
      [-3.18998873233795, 55.9428465054091],
      [-3.1870973110199, 55.9432881172426],
      [-3.18768203258514, 55.9444777403937],
      [-3.19057881832123, 55.9440241257753]
    ]
  },
  {
    name: 'Dr Elsie Inglis Quadrangle',
    coordinates: [
      [-3.19071829319, 55.9451957023404],
      [-3.19061636924744, 55.9449824179636],
      [-3.19002628326416, 55.9450755422726],
      [-3.19013357162476, 55.945297838105],
      [-3.19071829319, 55.9451957023404]
    ]
  },
  {
    name: 'Bristo Square Open Area',
    coordinates: [
      [-3.18954348564148, 55.9455231366331],
      [-3.18938255310059, 55.9455321485469],
      [-3.1892591714859, 55.9454480372693],
      [-3.18920016288757, 55.9453368899437],
      [-3.18919479846954, 55.9451957023404],
      [-3.18913578987122, 55.9451175983387],
      [-3.18813800811768, 55.9452738061846],
      [-3.18855106830597, 55.9461059027456],
      [-3.18953812122345, 55.9455591842759],
      [-3.18954348564148, 55.9455231366331]
    ]
  },
  {
    name: 'Bayes Central Area',
    coordinates: [
      [-3.1876927614212, 55.9452069673277],
      [-3.18755596876144, 55.9449621408666],
      [-3.18698197603226, 55.9450567672283],
      [-3.18723276257515, 55.9453699337766],
      [-3.18744599819183, 55.9453361389472],
      [-3.18737357854843, 55.9451934493426],
      [-3.18759351968765, 55.9451566503593],
      [-3.18762436509132, 55.9452197343093],
      [-3.1876927614212, 55.9452069673277]
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
    import('react-leaflet').then((L) => {
      import('leaflet').then((leaflet) => {
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
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {showServicePoints &&
              servicePoints.map((point) => (
                <Marker key={point.name} position={[point.lat, point.lng]}>
                  <Popup>
                    <strong>{point.name}</strong>
                    <br />
                    <span style={{ color: 'var(--grey-dark)' }}>{point.type}</span>
                  </Popup>
                </Marker>
              ))}

            {deliveryPoints.map((point) => (
              <Marker key={point.id} position={[point.lat, point.lng]}>
                <Popup>
                  <strong>Delivery #{point.id}</strong>
                </Popup>
              </Marker>
            ))}

            {showRestrictedAreas &&
              restrictedAreas.map((area) => (
                <Polygon
                  key={area.name}
                  positions={area.coordinates.map(([lng, lat]) => [lat, lng])}
                  pathOptions={{
                    color: '#cf1515',
                    fillColor: '#cf1515',
                    fillOpacity: 0.2
                  }}
                >
                  <Popup>{area.name} (Restricted)</Popup>
                </Polygon>
              ))}

            {geojson && geojson.coordinates.length > 0 && (
              <Polyline
                positions={geojson.coordinates.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: '#0064e2',
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
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-section">ROUTE MAP</h2>
        <div className="flex items-center gap-4 text-micro" style={{ color: 'var(--grey-dark)' }}>
          {showServicePoints && (
            <span className="flex items-center gap-1">
              <span style={{ width: '8px', height: '8px', background: 'var(--blue)', borderRadius: '0' }}></span>
              SERVICE
            </span>
          )}
          {showRestrictedAreas && (
            <span className="flex items-center gap-1">
              <span style={{ width: '8px', height: '8px', background: 'var(--red)', borderRadius: '0' }}></span>
              RESTRICTED
            </span>
          )}
          {geojson && (
            <span className="flex items-center gap-1">
              <span style={{ width: '8px', height: '8px', background: 'var(--blue)', borderRadius: '0' }}></span>
              ROUTE
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          height: '400px',
          borderRadius: '0',
          overflow: 'hidden',
          background: 'var(--grey-input)'
        }}
      >
        {MapComponent ? (
          <MapComponent />
        ) : (
          <div className="h-full flex items-center justify-center" style={{ color: 'var(--grey-dark)' }}>
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
