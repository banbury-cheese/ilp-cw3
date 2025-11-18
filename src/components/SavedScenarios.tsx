'use client';

import { useState, useEffect } from 'react';
import { Scenario } from '@/types';
import { getSavedScenarios, deleteScenario } from '@/lib/scenarios';

interface SavedScenariosProps {
  onLoad: (scenario: Scenario) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedScenarios({
  onLoad,
  isOpen,
  onClose
}: SavedScenariosProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    if (isOpen) {
      setScenarios(getSavedScenarios());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    deleteScenario(id);
    setScenarios(getSavedScenarios());
  };

  const handleLoad = (scenario: Scenario) => {
    onLoad(scenario);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-section">SAVED SCENARIOS</h2>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: 'var(--grey-dark)' }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {scenarios.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem 0' }}>
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <p className="text-body">No saved scenarios yet.</p>
            <p className="text-small mt-2">
              Plan routes and click &quot;Save Scenario&quot; to save.
            </p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                style={{
                  background: 'var(--grey-input)',
                  padding: '1rem',
                  borderRadius: '0'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-body" style={{ fontWeight: 600 }}>
                      {scenario.name}
                    </p>
                    <p className="text-small">
                      {new Date(scenario.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoad(scenario)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                    >
                      LOAD
                    </button>
                    <button
                      onClick={() => handleDelete(scenario.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="badge badge-neutral">
                    {scenario.dispatches.length} DISPATCHES
                  </span>
                  <span className="badge badge-info">
                    {scenario.plan.totalMoves} MOVES
                  </span>
                  <span className="badge badge-success">
                    COST: {scenario.plan.totalCost.toFixed(2)}
                  </span>
                </div>

                <p className="text-small" style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {scenario.inputText.substring(0, 100)}
                  {scenario.inputText.length > 100 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
