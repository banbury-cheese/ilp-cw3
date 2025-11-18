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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Structured Dispatches
        </h2>
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-300 mb-4"
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
          <p className="text-sm">
            No dispatches yet. Use natural language input to generate them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Structured Dispatches
        </h2>
        <span className="text-sm text-gray-500">
          {dispatches.length} dispatch{dispatches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0"
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
              <p className="text-sm font-medium text-blue-800 mb-1">
                Interpretation Notes
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
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
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0"
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
              <p className="text-sm font-medium text-amber-800 mb-1">
                Warnings
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
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
              className={`p-4 rounded-xl border ${
                hasErrors
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    Dispatch #{dispatch.id}
                  </span>
                  {/* Requirement badges */}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                    {dispatch.requirements.capacity}kg
                  </span>
                  {dispatch.requirements.cooling && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Cooling
                    </span>
                  )}
                  {dispatch.requirements.heating && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Heating
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeDispatch(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ID
                  </label>
                  <input
                    type="number"
                    value={dispatch.id}
                    onChange={(e) =>
                      updateDispatch(index, { id: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={dispatch.date}
                    onChange={(e) =>
                      updateDispatch(index, { date: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={dispatch.time}
                    onChange={(e) =>
                      updateDispatch(index, { time: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Cooling */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`cooling-${index}`}
                    checked={dispatch.requirements.cooling || false}
                    onChange={(e) =>
                      updateRequirements(index, { cooling: e.target.checked })
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`cooling-${index}`}
                    className="text-sm text-gray-700"
                  >
                    Cooling
                  </label>
                </div>

                {/* Heating */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`heating-${index}`}
                    checked={dispatch.requirements.heating || false}
                    onChange={(e) =>
                      updateRequirements(index, { heating: e.target.checked })
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`heating-${index}`}
                    className="text-sm text-gray-700"
                  >
                    Heating
                  </label>
                </div>

                {/* Longitude */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Latitude */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Max Cost (optional) */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Validation errors */}
              {hasErrors && (
                <div className="mt-3 text-xs text-red-600">
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
      <div className="mt-4 flex gap-3">
        <button
          onClick={onValidate}
          disabled={isLoading || dispatches.length === 0}
          className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-xl transition-colors duration-200 text-sm"
        >
          Check Available Drones
        </button>
        <button
          onClick={onPlanRoutes}
          disabled={isLoading || dispatches.length === 0}
          className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 text-sm"
        >
          Plan Routes
        </button>
      </div>

      {/* Available drones */}
      {availableDrones !== null && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
          <p className="text-sm font-medium text-green-800 mb-1">
            Available Drones
          </p>
          {availableDrones.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableDrones.map((droneId) => (
                <span
                  key={droneId}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  Drone {droneId}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-700">
              No drones available for these requirements
            </p>
          )}
        </div>
      )}
    </div>
  );
}
