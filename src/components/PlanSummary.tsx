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
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h2 className="text-title" style={{ marginBottom: 'var(--space-4)' }}>
          Plan Summary
        </h2>
        <div className="text-center" style={{ padding: 'var(--space-8) 0', color: 'var(--color-text-muted)' }}>
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p style={{ fontSize: 'var(--text-sm)' }}>
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
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <h2 className="text-title" style={{ marginBottom: 'var(--space-4)' }}>Plan Summary</h2>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
            {plan.totalCost.toFixed(2)}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginTop: '4px' }}>Total Cost</p>
        </div>
        <div style={{ background: 'var(--color-success-soft)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-success)' }}>{plan.totalMoves}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginTop: '4px' }}>Total Moves</p>
        </div>
        <div style={{ background: 'var(--color-info-soft)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-info)' }}>{totalDeliveries}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-info)', marginTop: '4px' }}>Deliveries</p>
        </div>
      </div>

      {/* Drone breakdown */}
      <div>
        <h3 className="text-label" style={{ marginBottom: 'var(--space-3)' }}>
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
                style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>
                    {info.name}{' '}
                    <span style={{ color: 'var(--color-text-muted)' }}>#{dronePath.droneId}</span>
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    {dronePath.deliveries.length} deliveries
                  </span>
                </div>
                <div className="flex flex-wrap gap-1" style={{ marginBottom: 'var(--space-2)' }}>
                  <span className="badge badge-neutral">
                    {info.capacity}kg
                  </span>
                  {info.cooling && (
                    <span className="badge badge-info">
                      Cooling
                    </span>
                  )}
                  {info.heating && (
                    <span className="badge badge-warning">
                      Heating
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
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
