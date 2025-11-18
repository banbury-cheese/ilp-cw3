'use client';

import { useState } from 'react';
import NaturalLanguageInput from '@/components/NaturalLanguageInput';
import DispatchListEditor from '@/components/DispatchListEditor';
import MapView from '@/components/MapView';
import PlanSummary from '@/components/PlanSummary';
import SavedScenarios from '@/components/SavedScenarios';
import PrescriptionInsights, { PrescriptionAnalysis } from '@/components/PrescriptionInsights';
import {
  MedDispatchRec,
  DispatchParseResult,
  GeoJsonLineString,
  IlpPlanResponse,
  Scenario
} from '@/types';
import { validateDispatches, formatValidationErrors } from '@/lib/validation';
import { saveScenario, generateScenarioId } from '@/lib/scenarios';

export default function Home() {
  const [dispatches, setDispatches] = useState<MedDispatchRec[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [availableDrones, setAvailableDrones] = useState<string[] | null>(null);
  const [plan, setPlan] = useState<IlpPlanResponse | null>(null);
  const [geojson, setGeojson] = useState<GeoJsonLineString | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved scenarios state
  const [showScenariosModal, setShowScenariosModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'freetext' | 'prescription'>('freetext');

  // Prescription insights state
  const [prescriptionAnalysis, setPrescriptionAnalysis] = useState<PrescriptionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleGenerate = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setAvailableDrones(null);
    setPlan(null);
    setGeojson(null);
    setInputText(text);
    setInputType('freetext');
    setPrescriptionAnalysis(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const idBase = Date.now() % 10000;

      const response = await fetch('/api/nlp/parse-dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: text, defaultDate: today, defaultTime, idBase })
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
    setIsAnalyzing(true);
    setError(null);
    setAvailableDrones(null);
    setPlan(null);
    setGeojson(null);
    setInputText(prescriptionText);
    setInputType('prescription');
    setPrescriptionAnalysis(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const idBase = Date.now() % 10000;

      // Run both the conversion and analysis in parallel
      const [convertResponse, analysisResponse] = await Promise.all([
        fetch('/api/prescriptions/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: prescriptionText, defaultDate: today, defaultTime, idBase })
        }),
        fetch('/api/prescriptions/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: prescriptionText })
        })
      ]);

      if (!convertResponse.ok) {
        const errorData = await convertResponse.json();
        throw new Error(errorData.details || 'Failed to convert prescription');
      }

      const result: DispatchParseResult = await convertResponse.json();
      setDispatches(result.dispatches);
      setNotes(result.notes);
      setWarnings(result.warnings);

      // Handle analysis response (don't fail if analysis fails)
      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json();
        setPrescriptionAnalysis(analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
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

  const handleSaveScenario = () => {
    if (!plan || !geojson) return;

    const scenarioName = prompt('Enter a name for this scenario:', `Scenario ${new Date().toLocaleDateString()}`);
    if (!scenarioName) return;

    const scenario: Scenario = {
      id: generateScenarioId(),
      name: scenarioName,
      timestamp: Date.now(),
      inputType,
      inputText,
      dispatches,
      plan,
      geojson
    };

    saveScenario(scenario);
    alert('Scenario saved successfully!');
  };

  const handleLoadScenario = (scenario: Scenario) => {
    setDispatches(scenario.dispatches);
    setPlan(scenario.plan);
    setGeojson(scenario.geojson);
    setInputText(scenario.inputText);
    setInputType(scenario.inputType);
    setNotes([]);
    setWarnings([]);
    setAvailableDrones(null);
    setError(null);
  };

  const deliveryPoints = dispatches.map((d) => ({
    id: d.id,
    lng: d.delivery.lng,
    lat: d.delivery.lat
  }));

  return (
    <div className="min-h-screen" style={{ background: 'var(--grey-light)' }}>
      {/* Navigation */}
      <nav style={{ background: 'var(--white)', borderBottom: '1px solid var(--grey-light)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <span className="text-section">
                ILP DISPATCH STUDIO
              </span>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowScenariosModal(true)}
                className="text-body uppercase hover:opacity-70 transition-opacity"
              >
                Saved
              </button>
              <a href="#" className="text-body uppercase hover:opacity-70 transition-opacity">Docs</a>
              <a href="#" className="text-body uppercase hover:opacity-70 transition-opacity">About</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--grey-light)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="max-w-2xl">
            <h1 className="text-display mb-4">
              DISPATCH BUILDER FOR DRONE DELIVERY
            </h1>
            <p className="text-body mb-6" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              Convert natural language or prescriptions into structured dispatch data. Plan optimal routes and visualise them instantly.
            </p>
            <a
              href="#workspace"
              className="btn btn-primary"
            >
              START BUILDING
            </a>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div id="workspace" className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Error display */}
        {error && (
          <div className="alert alert-error mb-6">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-label" style={{ color: 'var(--error-text)', marginBottom: '4px' }}>ERROR</p>
                <p className="text-body" style={{ color: 'var(--error-text)' }}>{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="hover:opacity-70 transition-opacity"
                style={{ color: 'var(--error-text)' }}
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
          <div className="lg:col-span-4 space-y-6">
            <NaturalLanguageInput
              onGenerate={handleGenerate}
              onPrescriptionConvert={handlePrescriptionConvert}
              isLoading={isLoading}
            />
            {(prescriptionAnalysis || isAnalyzing) && (
              <PrescriptionInsights
                analysis={prescriptionAnalysis}
                isLoading={isAnalyzing}
              />
            )}
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
            {plan && geojson && (
              <button
                onClick={handleSaveScenario}
                className="btn btn-secondary w-full"
              >
                SAVE SCENARIO
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Saved Scenarios Modal */}
      <SavedScenarios
        isOpen={showScenariosModal}
        onClose={() => setShowScenariosModal(false)}
        onLoad={handleLoadScenario}
      />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--grey-light)', marginTop: '3rem', background: 'var(--white)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-small uppercase">
              ILP Dispatch Studio - Drone-based medical delivery
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-small uppercase hover:opacity-70 transition-opacity">Privacy</a>
              <a href="#" className="text-small uppercase hover:opacity-70 transition-opacity">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
