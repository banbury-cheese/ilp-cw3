'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { MedDispatchRec, ValidationError } from '@/types';
import { validateDispatch } from '@/lib/validation';

interface DispatchListEditorProps {
  dispatches: MedDispatchRec[];
  notes: string[];
  warnings: string[];
  onDispatchesChange: (dispatches: MedDispatchRec[]) => void;
  onValidate: () => void;
  onPlanRoutes: () => void;
  isLoading: boolean;
  availableDrones: string[] | null;
}

interface GeocodingState {
  [key: number]: {
    isGeocoding: boolean;
    error: string | null;
  };
}

export default function DispatchListEditor({
  dispatches,
  notes,
  warnings,
  onDispatchesChange,
  onValidate,
  onPlanRoutes,
  isLoading,
  availableDrones
}: DispatchListEditorProps) {
  const [geocodingState, setGeocodingState] = useState<GeocodingState>({});
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const updateDispatch = (index: number, updates: Partial<MedDispatchRec>) => {
    const newDispatches = [...dispatches];
    newDispatches[index] = { ...newDispatches[index], ...updates };
    onDispatchesChange(newDispatches);
  };

  const updateRequirements = (
    index: number,
    updates: Partial<MedDispatchRec['requirements']>
  ) => {
    const newDispatches = [...dispatches];
    newDispatches[index] = {
      ...newDispatches[index],
      requirements: { ...newDispatches[index].requirements, ...updates }
    };
    onDispatchesChange(newDispatches);
  };

  const updateDelivery = (
    index: number,
    updates: Partial<MedDispatchRec['delivery']>
  ) => {
    const newDispatches = [...dispatches];
    newDispatches[index] = {
      ...newDispatches[index],
      delivery: { ...newDispatches[index].delivery, ...updates }
    };
    onDispatchesChange(newDispatches);
  };

  const removeDispatch = (index: number) => {
    const newDispatches = dispatches.filter((_, i) => i !== index);
    onDispatchesChange(newDispatches);
  };

  const getValidationErrors = (dispatch: MedDispatchRec): ValidationError[] => {
    return validateDispatch(dispatch);
  };

  // Geocode address to coordinates
  const handleAddressChange = useCallback(async (index: number, address: string) => {
    const dispatchId = dispatches[index].id;

    // Update the address immediately
    updateDelivery(index, { address });

    // Clear existing timer
    if (debounceTimers.current[`address-${dispatchId}`]) {
      clearTimeout(debounceTimers.current[`address-${dispatchId}`]);
    }

    // If address is empty, don't geocode
    if (!address || address.trim().length === 0) {
      setGeocodingState(prev => ({
        ...prev,
        [dispatchId]: { isGeocoding: false, error: null }
      }));
      return;
    }

    // Debounce geocoding by 1 second
    debounceTimers.current[`address-${dispatchId}`] = setTimeout(async () => {
      setGeocodingState(prev => ({
        ...prev,
        [dispatchId]: { isGeocoding: true, error: null }
      }));

      try {
        const response = await fetch('/api/geocoding/forward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: address.trim() })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Geocoding failed');
        }

        const result = await response.json();

        // Update coordinates
        updateDelivery(index, {
          lat: result.lat,
          lng: result.lng,
          address: result.formattedAddress // Use the formatted address from geocoding
        });

        setGeocodingState(prev => ({
          ...prev,
          [dispatchId]: { isGeocoding: false, error: null }
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Geocoding failed';
        setGeocodingState(prev => ({
          ...prev,
          [dispatchId]: { isGeocoding: false, error: errorMessage }
        }));
      }
    }, 1000);
  }, [dispatches]);

  // Reverse geocode coordinates to address
  const handleCoordinatesChange = useCallback(async (
    index: number,
    lat?: number,
    lng?: number
  ) => {
    const dispatch = dispatches[index];
    const dispatchId = dispatch.id;
    const newLat = lat !== undefined ? lat : dispatch.delivery.lat;
    const newLng = lng !== undefined ? lng : dispatch.delivery.lng;

    // Update coordinates immediately
    if (lat !== undefined || lng !== undefined) {
      updateDelivery(index, {
        lat: newLat,
        lng: newLng
      });
    }

    // Clear existing timer
    if (debounceTimers.current[`coords-${dispatchId}`]) {
      clearTimeout(debounceTimers.current[`coords-${dispatchId}`]);
    }

    // Validate coordinates before attempting reverse geocoding
    if (isNaN(newLat) || isNaN(newLng) || newLat === 0 || newLng === 0) {
      return;
    }

    // Debounce reverse geocoding by 1 second
    debounceTimers.current[`coords-${dispatchId}`] = setTimeout(async () => {
      setGeocodingState(prev => ({
        ...prev,
        [dispatchId]: { isGeocoding: true, error: null }
      }));

      try {
        const response = await fetch('/api/geocoding/reverse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: newLat, lng: newLng })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Reverse geocoding failed');
        }

        const result = await response.json();

        // Update address with the formatted address from reverse geocoding
        updateDelivery(index, {
          address: result.formattedAddress
        });

        setGeocodingState(prev => ({
          ...prev,
          [dispatchId]: { isGeocoding: false, error: null }
        }));
      } catch (error) {
        // Silently fail for reverse geocoding - it's not critical
        setGeocodingState(prev => ({
          ...prev,
          [dispatchId]: { isGeocoding: false, error: null }
        }));
      }
    }, 1000);
  }, [dispatches]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  if (dispatches.length === 0) {
    return (
      <div className="card">
        <h2 className="text-section mb-4">
          STRUCTURED DISPATCHES
        </h2>
        <div className="text-center" style={{ padding: '2rem 0' }}>
          <svg
            className="mx-auto mb-4"
            style={{ height: '48px', width: '48px', color: 'var(--grey-dark)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-body">
            No dispatches yet. Use natural language input to generate them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-section">
          STRUCTURED DISPATCHES
        </h2>
        <span className="text-mono" style={{ color: 'var(--grey-dark)' }}>
          {dispatches.length} DISPATCH{dispatches.length !== 1 ? 'ES' : ''}
        </span>
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <div className="alert alert-info mb-4">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-label mb-1">INTERPRETATION NOTES</p>
              <ul className="text-small space-y-1">
                {notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="alert alert-warning mb-4">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-label mb-1">WARNINGS</p>
              <ul className="text-small space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Cards */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {dispatches.map((dispatch, index) => {
          const errors = getValidationErrors(dispatch);
          const hasErrors = errors.length > 0;
          const geocoding = geocodingState[dispatch.id];

          return (
            <div
              key={dispatch.id}
              style={{
                padding: '0.875rem',
                borderRadius: '0',
                border: `1px solid ${hasErrors ? 'var(--red)' : 'var(--grey-light)'}`,
                background: hasErrors ? 'var(--error-bg)' : 'var(--grey-input)'
              }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-mono" style={{ fontWeight: 700 }}>
                    DISPATCH #{dispatch.id}
                  </span>
                  <span className="badge badge-neutral">
                    {dispatch.requirements.capacity}KG
                  </span>
                  {dispatch.requirements.cooling && (
                    <span className="badge badge-info">COOLING</span>
                  )}
                  {dispatch.requirements.heating && (
                    <span className="badge badge-warning">HEATING</span>
                  )}
                </div>
                <button
                  onClick={() => removeDispatch(index)}
                  className="transition-opacity hover:opacity-70"
                  style={{ color: 'var(--grey-dark)' }}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* ID */}
                <div>
                  <label className="text-label block mb-1">ID</label>
                  <input
                    type="number"
                    value={dispatch.id}
                    onChange={(e) =>
                      updateDispatch(index, { id: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-label block mb-1">DATE</label>
                  <input
                    type="date"
                    value={dispatch.date}
                    onChange={(e) =>
                      updateDispatch(index, { date: e.target.value })
                    }
                    className="input"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="text-label block mb-1">TIME</label>
                  <input
                    type="time"
                    value={dispatch.time}
                    onChange={(e) =>
                      updateDispatch(index, { time: e.target.value })
                    }
                    className="input"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="text-label block mb-1">CAPACITY (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dispatch.requirements.capacity}
                    onChange={(e) =>
                      updateRequirements(index, {
                        capacity: parseFloat(e.target.value) || 0
                      })
                    }
                    className="input"
                  />
                </div>

                {/* Cooling */}
                <div className="flex items-center justify-between">
                  <label className="text-small">COOLING</label>
                  <button
                    type="button"
                    onClick={() =>
                      updateRequirements(index, { cooling: !dispatch.requirements.cooling })
                    }
                    className={`toggle ${dispatch.requirements.cooling ? 'active' : ''}`}
                    role="switch"
                    aria-checked={dispatch.requirements.cooling || false}
                  />
                </div>

                {/* Heating */}
                <div className="flex items-center justify-between">
                  <label className="text-small">HEATING</label>
                  <button
                    type="button"
                    onClick={() =>
                      updateRequirements(index, { heating: !dispatch.requirements.heating })
                    }
                    className={`toggle ${dispatch.requirements.heating ? 'active' : ''}`}
                    role="switch"
                    aria-checked={dispatch.requirements.heating || false}
                  />
                </div>

                {/* Location / Address */}
                <div className="col-span-2">
                  <label className="text-label block mb-1">
                    LOCATION / ADDRESS
                    {geocoding?.isGeocoding && (
                      <span className="ml-2 text-small" style={{ color: 'var(--blue)', fontWeight: 400 }}>
                        (Geocoding...)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={dispatch.delivery.address || ''}
                    onChange={(e) => handleAddressChange(index, e.target.value)}
                    placeholder="Enter address or location name"
                    className="input"
                  />
                  {geocoding?.error && (
                    <p className="text-micro mt-1" style={{ color: 'var(--red)' }}>
                      {geocoding.error}
                    </p>
                  )}
                </div>

                {/* Longitude */}
                <div>
                  <label className="text-label block mb-1">LONGITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={dispatch.delivery.lng ?? ''}
                    onChange={(e) => {
                      const newLng = parseFloat(e.target.value) || 0;
                      handleCoordinatesChange(index, undefined, newLng);
                    }}
                    className="input"
                  />
                </div>

                {/* Latitude */}
                <div>
                  <label className="text-label block mb-1">LATITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={dispatch.delivery.lat ?? ''}
                    onChange={(e) => {
                      const newLat = parseFloat(e.target.value) || 0;
                      handleCoordinatesChange(index, newLat, undefined);
                    }}
                    className="input"
                  />
                </div>

                {/* Max Cost */}
                <div className="col-span-2">
                  <label className="text-label block mb-1">MAX COST (OPTIONAL)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dispatch.requirements.maxCost || ''}
                    onChange={(e) =>
                      updateRequirements(index, {
                        maxCost: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined
                      })
                    }
                    placeholder="NO LIMIT"
                    className="input"
                  />
                </div>
              </div>

              {/* Validation errors */}
              {hasErrors && (
                <div className="mt-3 text-small" style={{ color: 'var(--red)' }}>
                  {errors.map((err, i) => (
                    <p key={i}>{err.message}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onValidate}
          disabled={isLoading || dispatches.length === 0}
          className="btn btn-secondary flex-1"
        >
          CHECK DRONES
        </button>
        <button
          onClick={onPlanRoutes}
          disabled={isLoading || dispatches.length === 0}
          className="btn btn-primary flex-1"
        >
          PLAN ROUTES
        </button>
      </div>

      {/* Available drones */}
      {availableDrones !== null && (
        <div className="alert alert-success mt-4">
          <p className="text-label mb-1">AVAILABLE DRONES</p>
          {availableDrones.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableDrones.map((droneId) => (
                <span key={droneId} className="badge badge-success">
                  DRONE {droneId}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-small">
              No drones available for these requirements
            </p>
          )}
        </div>
      )}
    </div>
  );
}
