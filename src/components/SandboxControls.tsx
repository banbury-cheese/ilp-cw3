'use client';

import { SandboxZone, SandboxComparison } from '@/types';

interface SandboxControlsProps {
  isEnabled: boolean;
  onToggle: () => void;
  isDrawing: boolean;
  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  customZones: SandboxZone[];
  onRemoveZone: (id: string) => void;
  onClearAll: () => void;
  comparison: SandboxComparison | null;
  isComparing: boolean;
  onCompare: () => void;
  hasPlan: boolean;
}

export default function SandboxControls({
  isEnabled,
  onToggle,
  isDrawing,
  onStartDrawing,
  onCancelDrawing,
  customZones,
  onRemoveZone,
  onClearAll,
  comparison,
  isComparing,
  onCompare,
  hasPlan
}: SandboxControlsProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-section">SANDBOX MODE</h2>
        <button
          type="button"
          onClick={onToggle}
          className={`toggle ${isEnabled ? 'active' : ''}`}
          role="switch"
          aria-checked={isEnabled}
        />
      </div>

      {!isEnabled ? (
        <p className="text-small">
          Enable sandbox mode to add or modify no-fly zones and see how they affect route planning.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Drawing controls */}
          <div>
            <p className="text-label mb-2">ADD NO-FLY ZONE</p>
            {isDrawing ? (
              <div className="space-y-2">
                <p className="text-small" style={{ color: 'var(--blue)' }}>
                  Click on the map to draw polygon vertices. Click the first point to close.
                </p>
                <button
                  onClick={onCancelDrawing}
                  className="btn btn-secondary w-full"
                  style={{ padding: '0.5rem' }}
                >
                  CANCEL DRAWING
                </button>
              </div>
            ) : (
              <button
                onClick={onStartDrawing}
                className="btn btn-primary w-full"
                style={{ padding: '0.5rem' }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                DRAW ZONE
              </button>
            )}
          </div>

          {/* Custom zones list */}
          {customZones.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-label">CUSTOM ZONES ({customZones.length})</p>
                <button
                  onClick={onClearAll}
                  className="text-micro hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--red)' }}
                >
                  CLEAR ALL
                </button>
              </div>
              <div className="space-y-2">
                {customZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between"
                    style={{
                      background: 'var(--grey-input)',
                      padding: '0.5rem 0.75rem'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          background: 'var(--yellow)',
                          borderRadius: '0'
                        }}
                      />
                      <span className="text-small">{zone.name}</span>
                    </div>
                    <button
                      onClick={() => onRemoveZone(zone.id)}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--grey-dark)' }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compare button */}
          {hasPlan && customZones.length > 0 && (
            <button
              onClick={onCompare}
              disabled={isComparing}
              className="btn btn-primary w-full"
            >
              {isComparing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  COMPARING...
                </>
              ) : (
                'COMPARE IMPACT'
              )}
            </button>
          )}

          {/* Comparison results */}
          {comparison && (
            <div className="space-y-3">
              <p className="text-label">IMPACT ANALYSIS</p>

              <div className="grid grid-cols-2 gap-2">
                <div style={{ background: 'var(--grey-input)', padding: '0.75rem', textAlign: 'center' }}>
                  <p className="text-micro mb-1">ORIGINAL</p>
                  <p className="text-mono" style={{ fontWeight: 700 }}>
                    {comparison.originalMoves} moves
                  </p>
                  <p className="text-small">{comparison.originalCost.toFixed(4)} cost</p>
                </div>
                <div style={{ background: 'var(--grey-input)', padding: '0.75rem', textAlign: 'center' }}>
                  <p className="text-micro mb-1">SANDBOX</p>
                  <p className="text-mono" style={{ fontWeight: 700, color: comparison.movesDifference > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {comparison.sandboxMoves} moves
                  </p>
                  <p className="text-small" style={{ color: comparison.costDifference > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {comparison.sandboxCost.toFixed(4)} cost
                  </p>
                </div>
              </div>

              <div style={{ background: comparison.movesDifference > 0 ? 'var(--error-bg)' : 'var(--success-bg)', padding: '0.75rem' }}>
                <p className="text-mono" style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                  {comparison.movesDifference > 0 ? '+' : ''}{comparison.movesDifference} MOVES
                  ({comparison.costDifference > 0 ? '+' : ''}{comparison.costDifference.toFixed(4)} COST)
                </p>
                <p className="text-small">{comparison.impactAnalysis}</p>
              </div>
            </div>
          )}

          {/* Help text */}
          {!comparison && customZones.length === 0 && (
            <div className="alert alert-info">
              <p className="text-small">
                Draw custom no-fly zones to see how they would affect drone routing. This helps understand movement constraints and plan for temporary restrictions.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
