'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { GeoJsonLineString, ServicePoint, RestrictedArea, SandboxZone } from '@/types';
import { calculateHeading, calculateCumulativeCost } from '@/lib/scenarios';

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
  // Sandbox mode props
  sandboxMode?: boolean;
  isDrawing?: boolean;
  drawingPoints?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  customZones?: SandboxZone[];
  sandboxGeojson?: GeoJsonLineString | null;
}

export default function MapView({
  geojson,
  deliveryPoints = [],
  showServicePoints = true,
  showRestrictedAreas = true,
  sandboxMode = false,
  isDrawing = false,
  drawingPoints = [],
  onMapClick,
  customZones = [],
  sandboxGeojson = null
}: MapViewProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    dronePosition?: [number, number];
    onMapClick?: (lat: number, lng: number) => void;
    isDrawing?: boolean;
    drawingPoints?: [number, number][];
    customZones?: SandboxZone[];
    sandboxGeojson?: GeoJsonLineString | null;
  }> | null>(null);

  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef<number | null>(null);

  const totalSteps = geojson?.coordinates.length || 0;
  const hasRoute = totalSteps > 0;

  // Current position for drone marker
  const dronePosition: [number, number] | undefined = hasRoute && currentStep < totalSteps
    ? [geojson!.coordinates[currentStep][1], geojson!.coordinates[currentStep][0]]
    : undefined;

  // Calculate heading
  const heading = hasRoute && currentStep < totalSteps - 1
    ? calculateHeading(
        geojson!.coordinates[currentStep],
        geojson!.coordinates[currentStep + 1]
      )
    : 'N';

  // Calculate cumulative cost
  const cumulativeCost = calculateCumulativeCost(currentStep);

  // Animation loop
  const animate = useCallback(() => {
    setCurrentStep(prev => {
      if (prev >= totalSteps - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [totalSteps]);

  useEffect(() => {
    if (isPlaying && hasRoute) {
      const interval = 200 / speed; // Base interval adjusted by speed
      animationRef.current = window.setInterval(animate, interval);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, speed, animate, hasRoute]);

  // Reset animation when route changes
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [geojson]);

  const handlePlayPause = () => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  useEffect(() => {
    import('react-leaflet').then((L) => {
      import('leaflet').then((leaflet) => {
        delete (leaflet.default.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create drone icon
        const droneIcon = leaflet.default.divIcon({
          className: 'drone-marker',
          html: `<div style="
            width: 24px;
            height: 24px;
            background: var(--blue);
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const { MapContainer, TileLayer, Polyline, Marker, Popup, Polygon, useMapEvents, CircleMarker } = L;

        // Component to handle map clicks
        const MapClickHandler = ({ onMapClick, isDrawing }: { onMapClick?: (lat: number, lng: number) => void; isDrawing?: boolean }) => {
          useMapEvents({
            click: (e) => {
              if (isDrawing && onMapClick) {
                onMapClick(e.latlng.lat, e.latlng.lng);
              }
            },
          });
          return null;
        };

        const Map = ({
          dronePosition,
          onMapClick: mapClickHandler,
          isDrawing: drawing,
          drawingPoints: points,
          customZones: zones,
          sandboxGeojson: sandboxPath
        }: {
          dronePosition?: [number, number];
          onMapClick?: (lat: number, lng: number) => void;
          isDrawing?: boolean;
          drawingPoints?: [number, number][];
          customZones?: SandboxZone[];
          sandboxGeojson?: GeoJsonLineString | null;
        }) => (
          <MapContainer
            center={[55.945, -3.19]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onMapClick={mapClickHandler} isDrawing={drawing} />

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

            {/* Custom sandbox zones */}
            {zones && zones.map((zone) => (
              <Polygon
                key={zone.id}
                positions={zone.coordinates.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: '#feb300',
                  fillColor: '#feb300',
                  fillOpacity: 0.3,
                  dashArray: '5, 5'
                }}
              >
                <Popup>{zone.name} (Sandbox)</Popup>
              </Polygon>
            ))}

            {/* Drawing in progress */}
            {drawing && points && points.length > 0 && (
              <>
                <Polyline
                  positions={points.map(([lng, lat]) => [lat, lng])}
                  pathOptions={{
                    color: '#feb300',
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
                {points.map(([lng, lat], i) => (
                  <CircleMarker
                    key={i}
                    center={[lat, lng]}
                    radius={5}
                    pathOptions={{
                      color: '#feb300',
                      fillColor: i === 0 ? '#feb300' : '#fff',
                      fillOpacity: 1
                    }}
                  />
                ))}
              </>
            )}

            {/* Original route */}
            {geojson && geojson.coordinates.length > 0 && (
              <Polyline
                positions={geojson.coordinates.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: sandboxPath ? '#0064e2' : '#0064e2',
                  weight: 3,
                  opacity: sandboxPath ? 0.4 : 0.8
                }}
              />
            )}

            {/* Sandbox route */}
            {sandboxPath && sandboxPath.coordinates.length > 0 && (
              <Polyline
                positions={sandboxPath.coordinates.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: '#026944',
                  weight: 3,
                  opacity: 0.8
                }}
              />
            )}

            {dronePosition && (
              <Marker position={dronePosition} icon={droneIcon}>
                <Popup>Drone Position</Popup>
              </Marker>
            )}
          </MapContainer>
        );

        setMapComponent(() => Map);
      });
    });
  }, [geojson, deliveryPoints, showServicePoints, showRestrictedAreas, customZones, sandboxGeojson, isDrawing, drawingPoints]);

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
          {customZones.length > 0 && (
            <span className="flex items-center gap-1">
              <span style={{ width: '8px', height: '8px', background: 'var(--yellow)', borderRadius: '0' }}></span>
              SANDBOX
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
          <MapComponent
            dronePosition={dronePosition}
            onMapClick={onMapClick}
            isDrawing={isDrawing}
            drawingPoints={drawingPoints}
            customZones={customZones}
            sandboxGeojson={sandboxGeojson}
          />
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

      {/* Animation Controls */}
      {hasRoute && (
        <div className="mt-3">
          {/* Info bar */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div style={{ background: 'var(--grey-input)', padding: '0.5rem', textAlign: 'center' }}>
              <p className="text-mono" style={{ fontWeight: 700, color: 'var(--charcoal)' }}>
                {currentStep} / {totalSteps - 1}
              </p>
              <p className="text-micro">STEP</p>
            </div>
            <div style={{ background: 'var(--grey-input)', padding: '0.5rem', textAlign: 'center' }}>
              <p className="text-mono" style={{ fontWeight: 700, color: 'var(--blue)' }}>
                {cumulativeCost.toFixed(4)}
              </p>
              <p className="text-micro">COST</p>
            </div>
            <div style={{ background: 'var(--grey-input)', padding: '0.5rem', textAlign: 'center' }}>
              <p className="text-mono" style={{ fontWeight: 700, color: 'var(--green)' }}>
                {heading}
              </p>
              <p className="text-micro">HEADING</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem' }}
            >
              {isPlaying ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleReset}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Speed selector */}
            <div className="flex gap-1 ml-auto">
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`btn-toggle ${speed === s ? 'active' : ''}`}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}
                >
                  {s}X
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
