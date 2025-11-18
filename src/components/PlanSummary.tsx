'use client';

import { IlpPlanResponse } from '@/types';

interface PlanSummaryProps {
  plan: IlpPlanResponse | null;
}

// Hardcoded drone info (based on typical ILP configuration)
const droneInfo: Record<
  string,
  { name: string; capacity: number; cooling: boolean; heating: boolean }
> = {
  '1': { name: 'Alpha', capacity: 3.0, cooling: true, heating: false },
  '2': { name: 'Beta', capacity: 2.5, cooling: false, heating: true },
  '3': { name: 'Gamma', capacity: 2.0, cooling: true, heating: true },
  '4': { name: 'Delta', capacity: 4.0, cooling: false, heating: false },
  '5': { name: 'Epsilon', capacity: 1.5, cooling: true, heating: false },
  '6': { name: 'Zeta', capacity: 3.5, cooling: false, heating: true },
  '7': { name: 'Eta', capacity: 2.0, cooling: true, heating: false },
  '8': { name: 'Theta', capacity: 2.5, cooling: false, heating: false },
  '9': { name: 'Iota', capacity: 3.0, cooling: true, heating: true }
};

export default function PlanSummary({ plan }: PlanSummaryProps) {
  if (!plan) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Plan Summary
        </h2>
        <div className="text-center py-8 text-gray-500">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm">
            No plan yet. Click &quot;Plan Routes&quot; to generate.
          </p>
        </div>
      </div>
    );
  }

  const totalDeliveries = plan.dronePaths.reduce(
    (sum, drone) => sum + drone.deliveries.length,
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Summary</h2>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {plan.totalCost.toFixed(2)}
          </p>
          <p className="text-xs text-indigo-500 mt-1">Total Cost</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{plan.totalMoves}</p>
          <p className="text-xs text-green-500 mt-1">Total Moves</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalDeliveries}</p>
          <p className="text-xs text-purple-500 mt-1">Deliveries</p>
        </div>
      </div>

      {/* Drone breakdown */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Drone Assignments
        </h3>
        <div className="space-y-3">
          {plan.dronePaths.map((dronePath) => {
            const info = droneInfo[dronePath.droneId] || {
              name: `Drone ${dronePath.droneId}`,
              capacity: 2.0,
              cooling: false,
              heating: false
            };

            return (
              <div
                key={dronePath.droneId}
                className="bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {info.name}{' '}
                    <span className="text-gray-400">#{dronePath.droneId}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    {dronePath.deliveries.length} deliveries
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">
                    {info.capacity}kg
                  </span>
                  {info.cooling && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                      Cooling
                    </span>
                  )}
                  {info.heating && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                      Heating
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Deliveries:{' '}
                  {dronePath.deliveries.map((d) => `#${d.deliveryId}`).join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
