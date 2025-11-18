'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (explanation) {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 className="text-section mb-4">EXPLAIN THIS PLAN</h2>

      {isDisabled ? (
        <div className="text-center" style={{ padding: '1.5rem 0' }}>
          <svg
            className="mx-auto mb-3"
            style={{ height: '40px', width: '40px', color: 'var(--grey-dark)' }}
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
          <p className="text-body">
            Generate a plan first to get an AI explanation.
          </p>
        </div>
      ) : (
        <>
          {/* Mode selector */}
          <div className="mb-4">
            <label className="text-label block mb-2">EXPLANATION STYLE</label>
            <div className="flex gap-2">
              {(['dispatcher', 'manager', 'regulator'] as ExplanationMode[]).map(
                (m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`btn-toggle flex-1 ${mode === m ? 'active' : ''}`}
                    style={{ padding: '0.5rem', fontSize: '0.7rem' }}
                  >
                    {m.toUpperCase()}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateExplanation}
            disabled={isLoading}
            className="btn btn-primary w-full"
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
                GENERATING...
              </>
            ) : (
              'GENERATE EXPLANATION'
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="alert alert-error mt-4">
              <p className="text-body">{error}</p>
            </div>
          )}

          {/* Explanation text */}
          {explanation && (
            <div className="mt-4">
              <div
                style={{
                  background: 'var(--grey-input)',
                  padding: '1rem',
                  maxHeight: '256px',
                  overflowY: 'auto',
                  position: 'relative'
                }}
              >
                <button
                  onClick={handleCopy}
                  className="transition-opacity hover:opacity-70"
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    padding: '0.25rem',
                    background: 'var(--white)',
                    border: '1px solid var(--grey-light)'
                  }}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg className="h-4 w-4" style={{ color: 'var(--green)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" style={{ color: 'var(--grey-dark)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <p className="text-body" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
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
