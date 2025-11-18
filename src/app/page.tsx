'use client';

import { useState } from 'react';
import NaturalLanguageInput from '@/components/NaturalLanguageInput';
import DispatchListEditor from '@/components/DispatchListEditor';
import MapView from '@/components/MapView';
import PlanSummary from '@/components/PlanSummary';
import ExplainPlan from '@/components/ExplainPlan';
import {
  MedDispatchRec,
  DispatchParseResult,
  GeoJsonLineString,
  IlpPlanResponse
} from '@/types';
import { validateDispatches, formatValidationErrors } from '@/lib/validation';

export default function Home() {
  const [dispatches, setDispatches] = useState<MedDispatchRec[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [availableDrones, setAvailableDrones] = useState<string[] | null>(null);
  const [plan, setPlan] = useState<IlpPlanResponse | null>(null);
  const [geojson, setGeojson] = useState<GeoJsonLineString | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (inputText: string) => {
    setIsLoading(true);
    setError(null);
    setAvailableDrones(null);
    setPlan(null);
    setGeojson(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const idBase = Date.now() % 10000;

      const response = await fetch('/api/nlp/parse-dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText, defaultDate: today, defaultTime, idBase })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to parse dispatches');
      }

      const result: DispatchParseResult = await response.json();
      setDispatches(result.dispatches);
      setNotes(result.notes);
      setWarnings(result.warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrescriptionConvert = async (prescriptionText: string) => {
    setIsLoading(true);
    setError(null);
    setAvailableDrones(null);
    setPlan(null);
    setGeojson(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const idBase = Date.now() % 10000;

      const response = await fetch('/api/prescriptions/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prescriptionText, defaultDate: today, defaultTime, idBase })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to convert prescription');
      }

      const result: DispatchParseResult = await response.json();
      setDispatches(result.dispatches);
      setNotes(result.notes);
      setWarnings(result.warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    setIsLoading(true);
    setError(null);

    const errors = validateDispatches(dispatches);
    if (errors.length > 0) {
      setError(formatValidationErrors(errors));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ilp/query-available-drones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatches)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to query drones');
      }

      const result = await response.json();
      setAvailableDrones(result.drones);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanRoutes = async () => {
    setIsLoading(true);
    setError(null);

    const errors = validateDispatches(dispatches);
    if (errors.length > 0) {
      setError(formatValidationErrors(errors));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ilp/plan-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatches)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to plan routes');
      }

      const result = await response.json();
      setPlan(result.plan);
      setGeojson(result.geojson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const deliveryPoints = dispatches.map((d) => ({
    id: d.id,
    lng: d.delivery.lng,
    lat: d.delivery.lat
  }));

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Navigation */}
      <nav style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-main)' }}>
                ILP Dispatch Studio
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-body hover:opacity-70 transition-opacity">Docs</a>
              <a href="#" className="text-body hover:opacity-70 transition-opacity">About</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(135deg, var(--color-primary-soft) 0%, var(--color-surface) 50%, var(--color-info-soft) 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-2xl">
            <h1 className="text-display mb-4">
              Dispatch builder for drone delivery
            </h1>
            <p className="text-subtitle mb-6" style={{ fontSize: 'var(--text-lg)' }}>
              Convert natural language or prescriptions into structured dispatch data. Plan optimal routes and visualise them instantly.
            </p>
            <a
              href="#workspace"
              className="btn btn-primary"
              style={{ padding: 'var(--space-3) var(--space-6)' }}
            >
              Start Building Dispatches
            </a>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div id="workspace" className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Error display */}
        {error && (
          <div
            className="mb-6 p-4"
            style={{
              background: 'var(--color-danger-soft)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--color-danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p style={{ fontWeight: 500, color: 'var(--color-danger)', marginBottom: '2px' }}>Something went wrong</p>
                <p className="text-body">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-danger)' }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Three-column layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: Input (4 cols) */}
          <div className="lg:col-span-4">
            <NaturalLanguageInput
              onGenerate={handleGenerate}
              onPrescriptionConvert={handlePrescriptionConvert}
              isLoading={isLoading}
            />
          </div>

          {/* Middle: Dispatches (4 cols) */}
          <div className="lg:col-span-4">
            <DispatchListEditor
              dispatches={dispatches}
              notes={notes}
              warnings={warnings}
              onDispatchesChange={setDispatches}
              onValidate={handleValidate}
              onPlanRoutes={handlePlanRoutes}
              isLoading={isLoading}
              availableDrones={availableDrones}
            />
          </div>

          {/* Right: Map & Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <MapView
              geojson={geojson}
              deliveryPoints={deliveryPoints}
              showServicePoints={true}
              showRestrictedAreas={true}
            />
            <PlanSummary plan={plan} />
            <ExplainPlan dispatches={dispatches} plan={plan} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-12)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-caption" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
              ILP Dispatch Studio — Drone-based medical delivery
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-body hover:opacity-70 transition-opacity">Privacy</a>
              <a href="#" className="text-body hover:opacity-70 transition-opacity">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
