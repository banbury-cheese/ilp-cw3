'use client';

interface Medication {
  name: string;
  dose?: string;
  quantity?: string;
  temperatureSensitive: boolean;
  temperatureRequirement?: 'cooling' | 'heating' | null;
  notes?: string;
}

interface DrugInteraction {
  type: 'major' | 'moderate' | 'minor';
  message: string;
}

interface TemperatureValidation {
  medication: string;
  requiresCooling: boolean;
  requiresHeating: boolean;
  specialHandling: string[];
}

interface SafetyChecks {
  hasInteractions: boolean;
  hasMajorInteractions: boolean;
  requiresColdChain: boolean;
  requiresHeating: boolean;
}

export interface PrescriptionAnalysis {
  medications: Medication[];
  ambiguities: string[];
  warnings: string[];
  summary: string;
  drugInteractions?: DrugInteraction[];
  temperatureValidation?: TemperatureValidation[];
  recognizedMedications?: string[];
  safetyChecks?: SafetyChecks;
}

interface PrescriptionInsightsProps {
  analysis: PrescriptionAnalysis | null;
  isLoading: boolean;
}

export default function PrescriptionInsights({
  analysis,
  isLoading
}: PrescriptionInsightsProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-section mb-4">PRESCRIPTION INSIGHTS</h2>
        <div className="flex items-center justify-center" style={{ padding: '2rem 0' }}>
          <svg
            className="animate-spin h-6 w-6"
            style={{ color: 'var(--blue)' }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-3 text-body">Analyzing prescription...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="card">
        <h2 className="text-section mb-4">PRESCRIPTION INSIGHTS</h2>
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
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          <p className="text-body">
            Convert a prescription to see AI-powered insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-section mb-4">PRESCRIPTION INSIGHTS</h2>

      {/* Summary */}
      {analysis.summary && (
        <div className="mb-4" style={{ background: 'var(--grey-input)', padding: '0.875rem' }}>
          <p className="text-body">{analysis.summary}</p>
        </div>
      )}

      {/* Medications */}
      {analysis.medications.length > 0 && (
        <div className="mb-4">
          <p className="text-label mb-2">MEDICATIONS</p>
          <div className="space-y-2">
            {analysis.medications.map((med, index) => (
              <div
                key={index}
                style={{
                  background: 'var(--grey-input)',
                  padding: '0.7rem 0.875rem',
                  borderLeft: `3px solid ${
                    med.temperatureSensitive ? 'var(--blue)' : 'var(--grey-dark)'
                  }`
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-body" style={{ fontWeight: 600 }}>
                      {med.name}
                    </p>
                    {med.dose && (
                      <p className="text-small">{med.dose}</p>
                    )}
                    {med.quantity && (
                      <p className="text-small">Qty: {med.quantity}</p>
                    )}
                    {med.notes && (
                      <p className="text-small mt-1" style={{ fontStyle: 'italic' }}>
                        {med.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {med.temperatureSensitive && (
                      <span className={`badge ${
                        med.temperatureRequirement === 'cooling'
                          ? 'badge-info'
                          : med.temperatureRequirement === 'heating'
                          ? 'badge-warning'
                          : 'badge-neutral'
                      }`}>
                        {med.temperatureRequirement?.toUpperCase() || 'TEMP SENSITIVE'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ambiguities */}
      {analysis.ambiguities.length > 0 && (
        <div className="alert alert-warning mb-4">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-label mb-1">AMBIGUITIES</p>
              <ul className="text-small space-y-1">
                {analysis.ambiguities.map((ambiguity, i) => (
                  <li key={i}>{ambiguity}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Drug Interactions */}
      {analysis.drugInteractions && analysis.drugInteractions.length > 0 && (
        <div className={`alert mb-4 ${
          analysis.safetyChecks?.hasMajorInteractions ? 'alert-error' : 'alert-warning'
        }`}>
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-label mb-1" style={{
                color: analysis.safetyChecks?.hasMajorInteractions ? 'var(--error-text)' : 'inherit'
              }}>
                DRUG INTERACTIONS
              </p>
              <ul className="text-small space-y-2">
                {analysis.drugInteractions.map((interaction, i) => (
                  <li key={i}>
                    <span className={`badge ${
                      interaction.type === 'major' ? 'badge-error' :
                      interaction.type === 'moderate' ? 'badge-warning' :
                      'badge-neutral'
                    }`} style={{ fontSize: '0.6rem', padding: '0.125rem 0.5rem', marginRight: '0.5rem' }}>
                      {interaction.type.toUpperCase()}
                    </span>
                    {interaction.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Temperature Requirements */}
      {analysis.temperatureValidation && analysis.temperatureValidation.length > 0 && (
        <div className="mb-4">
          <p className="text-label mb-2">TEMPERATURE REQUIREMENTS</p>
          <div className="space-y-1">
            {analysis.temperatureValidation.map((temp, i) => (
              <div key={i} style={{ background: 'var(--grey-input)', padding: '0.625rem 0.875rem' }}>
                <div className="flex items-center justify-between">
                  <span className="text-body">{temp.medication}</span>
                  <div className="flex gap-2">
                    {temp.requiresCooling && (
                      <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>
                        COOLING
                      </span>
                    )}
                    {temp.requiresHeating && (
                      <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>
                        HEATING
                      </span>
                    )}
                  </div>
                </div>
                {temp.specialHandling.length > 0 && (
                  <p className="text-small mt-1" style={{ fontStyle: 'italic', color: 'var(--grey-dark)' }}>
                    {temp.specialHandling.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Summary */}
      {analysis.safetyChecks && (
        <div style={{
          background: analysis.safetyChecks.hasMajorInteractions ? 'var(--error-bg)' :
                     analysis.safetyChecks.hasInteractions ? 'var(--warning-bg)' :
                     'var(--grey-input)',
          padding: '0.875rem',
          border: `1px solid ${
            analysis.safetyChecks.hasMajorInteractions ? 'var(--red)' :
            analysis.safetyChecks.hasInteractions ? 'var(--yellow)' :
            'var(--grey)'
          }`
        }} className="mb-4">
          <p className="text-label mb-2">SAFETY SUMMARY</p>
          <div className="grid grid-cols-2 gap-2 text-small">
            <div className="flex items-center gap-1">
              {analysis.safetyChecks.hasInteractions ? (
                <svg className="h-4 w-4" style={{ color: 'var(--red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" style={{ color: 'var(--green)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>Drug Interactions</span>
            </div>
            <div className="flex items-center gap-1">
              {analysis.safetyChecks.requiresColdChain ? (
                <svg className="h-4 w-4" style={{ color: 'var(--blue)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" style={{ color: 'var(--green)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>Cold Chain</span>
            </div>
            <div className="flex items-center gap-1">
              {analysis.safetyChecks.requiresHeating ? (
                <svg className="h-4 w-4" style={{ color: 'var(--yellow)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" style={{ color: 'var(--green)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>Heating Required</span>
            </div>
            {analysis.recognizedMedications && (
              <div className="flex items-center gap-1">
                <svg className="h-4 w-4" style={{ color: 'var(--blue)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{analysis.recognizedMedications.length} Recognized</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="alert alert-error">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 mt-0.5 flex-shrink-0"
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
              <p className="text-label mb-1" style={{ color: 'var(--error-text)' }}>WARNINGS</p>
              <ul className="text-small space-y-1" style={{ color: 'var(--error-text)' }}>
                {analysis.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
