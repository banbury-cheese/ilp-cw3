'use client';

import { useState } from 'react';
import NaturalLanguageInput from '@/components/NaturalLanguageInput';
import DispatchListEditor from '@/components/DispatchListEditor';
import MapView from '@/components/MapView';
import PlanSummary from '@/components/PlanSummary';
import {
  MedDispatchRec,
  DispatchParseResult,
  GeoJsonLineString,
  IlpPlanResponse
} from '@/types';
import { validateDispatches, formatValidationErrors } from '@/lib/validation';

export default function Home() {
  // State
  const [dispatches, setDispatches] = useState<MedDispatchRec[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [availableDrones, setAvailableDrones] = useState<string[] | null>(null);
  const [plan, setPlan] = useState<IlpPlanResponse | null>(null);
  const [geojson, setGeojson] = useState<GeoJsonLineString | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate dispatches from natural language
  const handleGenerate = async (inputText: string) => {
    setIsLoading(true);
    setError(null);
    setAvailableDrones(null);
    setPlan(null);
    setGeojson(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const idBase = Date.now() % 10000;

      const response = await fetch('/api/nlp/parse-dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText,
          defaultDate: today,
          defaultTime,
          idBase
        })
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

  // Check available drones
  const handleValidate = async () => {
    setIsLoading(true);
    setError(null);

    // Client-side validation
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

  // Plan routes
  const handlePlanRoutes = async () => {
    setIsLoading(true);
    setError(null);

    // Client-side validation
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

  // Get delivery points for map
  const deliveryPoints = dispatches.map((d) => ({
    id: d.id,
    lng: d.delivery.lng,
    lat: d.delivery.lat
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">
                ILP Dispatch Builder
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Docs
              </a>
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                About
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Natural-language dispatch builder for ILP
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Turn vague delivery requests into precise drone dispatches. Stop
                wrestling with JSON — describe what you need in plain English.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#workspace"
                  className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  View Documentation
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">You say:</p>
                      <p className="text-sm text-gray-800">
                        &quot;Deliver 2kg of insulin that needs cooling to Royal
                        Infirmary tomorrow at 2pm&quot;
                      </p>
                    </div>
                  </div>
                  <div className="border-l-2 border-indigo-200 ml-4 pl-4">
                    <svg
                      className="w-4 h-4 text-indigo-400 animate-bounce"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">We generate:</p>
                      <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600">
                        <pre>{`{
  "id": 1001,
  "date": "2025-11-19",
  "time": "14:00",
  "requirements": {
    "capacity": 2.0,
    "cooling": true
  }
}`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-600">
              Natural language processing turns your delivery requests into
              structured dispatch data automatically.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Validated</h3>
            <p className="text-sm text-gray-600">
              Built-in validation ensures your dispatches meet all requirements
              before sending to the ILP backend.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Visualized</h3>
            <p className="text-sm text-gray-600">
              See your planned routes on an interactive map with service points
              and restricted areas highlighted.
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div id="workspace" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-500 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
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
          </div>
        )}

        {/* Three-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Natural Language Input */}
          <div>
            <NaturalLanguageInput
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </div>

          {/* Middle: Dispatch Editor */}
          <div>
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

          {/* Right: Map & Summary */}
          <div className="space-y-6">
            <MapView
              geojson={geojson}
              deliveryPoints={deliveryPoints}
              showServicePoints={true}
              showRestrictedAreas={true}
            />
            <PlanSummary plan={plan} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              ILP Dispatch Builder — Intelligent drone-based medicine delivery
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Terms
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
