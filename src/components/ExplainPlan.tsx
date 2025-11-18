'use client';

import { useState } from 'react';
import { MedDispatchRec, IlpPlanResponse } from '@/types';

interface ExplainPlanProps {
  dispatches: MedDispatchRec[];
  plan: IlpPlanResponse | null;
}

type ExplanationMode = 'dispatcher' | 'manager' | 'regulator';

export default function ExplainPlan({ dispatches, plan }: ExplainPlanProps) {
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ExplanationMode>('dispatcher');

  const handleGenerateExplanation = async () => {
    if (!plan || dispatches.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ilp/explain-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatches,
          plan,
          explanationMode: mode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate explanation');
      }

      const result = await response.json();
      setExplanation(result.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !plan || dispatches.length === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Explain This Plan
      </h2>

      {isDisabled ? (
        <div className="text-center py-6 text-gray-500">
          <svg
            className="mx-auto h-10 w-10 text-gray-300 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">
            Generate a plan first to get an AI explanation.
          </p>
        </div>
      ) : (
        <>
          {/* Mode selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Explanation style
            </label>
            <div className="flex gap-2">
              {(['dispatcher', 'manager', 'regulator'] as ExplanationMode[]).map(
                (m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-colors duration-200 capitalize ${
                      mode === m
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateExplanation}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              'Generate Explanation'
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Explanation text */}
          {explanation && (
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {explanation}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
