'use client';

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

  if (dispatches.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h2 className="text-title" style={{ marginBottom: 'var(--space-4)' }}>
          Structured Dispatches
        </h2>
        <div className="text-center" style={{ padding: 'var(--space-12) 0', color: 'var(--color-text-muted)' }}>
          <svg
            className="mx-auto mb-4"
            style={{ height: '48px', width: '48px', color: 'var(--color-border)' }}
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
          <p style={{ fontSize: 'var(--text-sm)' }}>
            No dispatches yet. Use natural language input to generate them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 className="text-title">
          Structured Dispatches
        </h2>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          {dispatches.length} dispatch{dispatches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <div
          style={{
            marginBottom: 'var(--space-4)',
            padding: 'var(--space-3)',
            background: 'var(--color-info-soft)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-info)'
          }}
        >
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              style={{ color: 'var(--color-info)' }}
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
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-info)', marginBottom: '4px' }}>
                Interpretation Notes
              </p>
              <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--color-info)' }} className="space-y-1">
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
        <div
          style={{
            marginBottom: 'var(--space-4)',
            padding: 'var(--space-3)',
            background: 'var(--color-warning-soft)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-warning)'
          }}
        >
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              style={{ color: 'var(--color-warning)' }}
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
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-warning)', marginBottom: '4px' }}>
                Warnings
              </p>
              <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)' }} className="space-y-1">
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

          return (
            <div
              key={dispatch.id}
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${hasErrors ? 'var(--color-danger)' : 'var(--color-border-subtle)'}`,
                background: hasErrors ? 'var(--color-danger-soft)' : 'var(--color-bg)'
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-main)' }}>
                    Dispatch #{dispatch.id}
                  </span>
                  {/* Requirement badges */}
                  <span className="badge badge-neutral">
                    {dispatch.requirements.capacity}kg
                  </span>
                  {dispatch.requirements.cooling && (
                    <span className="badge badge-info">
                      Cooling
                    </span>
                  )}
                  {dispatch.requirements.heating && (
                    <span className="badge badge-warning">
                      Heating
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeDispatch(index)}
                  className="transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* ID */}
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: '4px' }}>
                    ID
                  </label>
                  <input
                    type="number"
                    value={dispatch.id}
                    onChange={(e) =>
                      updateDispatch(index, { id: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                    style={{ padding: 'var(--space-2) var(--space-3)' }}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: '4px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={dispatch.date}
                    onChange={(e) =>
                      updateDispatch(index, { date: e.target.value })
                    }
                    className="input"
                    style={{ padding: 'var(--space-2) var(--space-3)' }}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: '4px' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={dispatch.time}
                    onChange={(e) =>
                      updateDispatch(index, { time: e.target.value })
                    }
                    className="input"
                    style={{ padding: 'var(--space-2) var(--space-3)' }}
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: '4px' }}>
                    Capacity (kg)
                  </label>
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
                    style={{ padding: 'var(--space-2) var(--space-3)' }}
                  />
                </div>

                {/* Cooling - Toggle */}
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`cooling-${index}`}
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}
                  >
                    Cooling
                  </label>
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

                {/* Heating - Toggle */}
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`heating-${index}`}
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}
                  >
                    Heating
                  </label>
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

                {/* Longitude */}
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: '4px' }}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={dispatch.delivery.lng}
                    onChange={(e) =>
                      updateDelivery(index, {
                        lng: parseFloat(e.target.value) || 0
                      })
                    }
                    className="input"
                    style={{ padding: 'var(--space-2) var(--space-3)' }}
                  />
                </div>

                {/* Latitude */}
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: '4px' }}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={dispatch.delivery.lat}
                    onChange={(e) =>
                      updateDelivery(index, {
                        lat: parseFloat(e.target.value) || 0
                      })
                    }
                    className="input"
                    style={{ padding: 'var(--space-2) var(--space-3)' }}
                  />
                </div>

                {/* Max Cost (optional) */}
                <div className="col-span-2">
                  <label className="text-label" style={{ display: 'block', marginBottom: '4px' }}>
                    Max Cost (optional)
                  </label>
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
                    placeholder="No limit"
                    className="input"
                    style={{ padding: 'var(--space-2) var(--space-3)' }}
                  />
                </div>
              </div>

              {/* Validation errors */}
              {hasErrors && (
                <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
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
      <div className="flex gap-3" style={{ marginTop: 'var(--space-4)' }}>
        <button
          onClick={onValidate}
          disabled={isLoading || dispatches.length === 0}
          className="btn btn-secondary flex-1"
          style={{ borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)' }}
        >
          Check Available Drones
        </button>
        <button
          onClick={onPlanRoutes}
          disabled={isLoading || dispatches.length === 0}
          className="btn btn-primary flex-1"
          style={{ borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)' }}
        >
          Plan Routes
        </button>
      </div>

      {/* Available drones */}
      {availableDrones !== null && (
        <div
          style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3)',
            background: 'var(--color-success-soft)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-success)'
          }}
        >
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-success)', marginBottom: '4px' }}>
            Available Drones
          </p>
          {availableDrones.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableDrones.map((droneId) => (
                <span
                  key={droneId}
                  className="badge badge-success"
                >
                  Drone {droneId}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
              No drones available for these requirements
            </p>
          )}
        </div>
      )}
    </div>
  );
}
