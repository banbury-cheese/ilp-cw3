'use client';

import { useState } from 'react';
import { GeoJsonLineString, IlpPlanResponse } from '@/types';

interface ExportsReportsProps {
  geojson: GeoJsonLineString | null;
  plan: IlpPlanResponse | null;
}

export default function ExportsReports({
  geojson,
  plan
}: ExportsReportsProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleExportGeoJSON = () => {
    if (!geojson) return;

    const geoJsonFeature = {
      type: 'Feature',
      properties: {
        name: 'Drone Delivery Route',
        totalMoves: plan?.totalMoves || 0,
        totalCost: plan?.totalCost || 0,
        generatedAt: new Date().toISOString()
      },
      geometry: geojson
    };

    const blob = new Blob([JSON.stringify(geoJsonFeature, null, 2)], {
      type: 'application/geo+json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route_${Date.now()}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    if (!geojson || !plan) return;

    setIsGeneratingReport(true);

    try {
      const response = await fetch('/api/reports/regulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, geojson })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const { report } = await response.json();

      // Download as text file
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `regulator_report_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!geojson || !plan) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="text-section mb-4">EXPORTS & REPORTS</h2>

      <div className="space-y-3">
        {/* GeoJSON Export */}
        <button
          onClick={handleExportGeoJSON}
          className="btn btn-secondary w-full"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          EXPORT GEOJSON
        </button>

        {/* Regulator Report */}
        <button
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className="btn btn-secondary w-full"
        >
          {isGeneratingReport ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              GENERATING...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              REGULATOR REPORT
            </>
          )}
        </button>

        <p className="text-small" style={{ color: 'var(--grey-dark)' }}>
          GeoJSON can be imported into mapping tools. Regulator report includes compliance information for aviation authorities.
        </p>
      </div>
    </div>
  );
}
