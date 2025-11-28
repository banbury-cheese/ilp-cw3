'use client';

import { IlpPlanResponse } from '@/types';

interface PlanSummaryProps {
  plan: IlpPlanResponse | null;
}

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
      <div className="card">
        <h2 className="text-section mb-4">PLAN SUMMARY</h2>
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-body">
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
    <div className="card">
      <h2 className="text-section mb-4">PLAN SUMMARY</h2>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div style={{ background: 'var(--grey-input)', padding: '0.875rem', textAlign: 'center' }}>
          <p className="text-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--blue)' }}>
            {plan.totalCost.toFixed(2)}
          </p>
          <p className="text-micro mt-1">TOTAL COST</p>
        </div>
        <div style={{ background: 'var(--grey-input)', padding: '0.875rem', textAlign: 'center' }}>
          <p className="text-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>
            {plan.totalMoves}
          </p>
          <p className="text-micro mt-1">TOTAL MOVES</p>
        </div>
        <div style={{ background: 'var(--grey-input)', padding: '0.875rem', textAlign: 'center' }}>
          <p className="text-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--charcoal)' }}>
            {totalDeliveries}
          </p>
          <p className="text-micro mt-1">DELIVERIES</p>
        </div>
      </div>

      {/* Drone breakdown */}
      <div>
        <h3 className="text-label mb-3">DRONE ASSIGNMENTS</h3>
        <div className="space-y-2.5">
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
                style={{ background: 'var(--grey-input)', padding: '0.7rem 0.875rem' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body" style={{ fontWeight: 500 }}>
                    {info.name}{' '}
                    <span className="text-mono" style={{ color: 'var(--grey-dark)' }}>#{dronePath.droneId}</span>
                  </span>
                  <span className="text-mono" style={{ color: 'var(--grey-dark)' }}>
                    {dronePath.deliveries.length} DELIVERIES
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="badge badge-neutral">{info.capacity}KG</span>
                  {info.cooling && <span className="badge badge-info">COOLING</span>}
                  {info.heating && <span className="badge badge-warning">HEATING</span>}
                </div>
                <div className="text-mono text-small" style={{ color: 'var(--grey-dark)' }}>
                  DELIVERIES: {dronePath.deliveries.map((d) => `#${d.deliveryId}`).join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
