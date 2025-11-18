'use client';

import { useState } from 'react';
import PrescriptionUpload from './PrescriptionUpload';

interface NaturalLanguageInputProps {
  onGenerate: (text: string) => void;
  onPrescriptionConvert: (text: string) => void;
  isLoading: boolean;
}

const examplePrompts = [
  {
    title: 'COOLING REQUIRED',
    text: 'Deliver 2kg of insulin that needs cooling to the Royal Infirmary tomorrow at 2pm'
  },
  {
    title: 'HEATING REQUIRED',
    text: 'Send 500g of warm blood samples to Western General Hospital today around 4pm, keep them heated'
  },
  {
    title: 'MULTIPLE DELIVERIES',
    text: 'Tomorrow morning: 1kg of vaccines (refrigerated) to Sick Kids, and in the afternoon send 750g of medication to Marchmont. Try to keep cost under £50.'
  },
  {
    title: 'BASIC DELIVERY',
    text: 'Deliver 300g of prescription medication to George Square at 3:30pm today'
  }
];

type TabType = 'freetext' | 'prescription';

export default function NaturalLanguageInput({
  onGenerate,
  onPrescriptionConvert,
  isLoading
}: NaturalLanguageInputProps) {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('freetext');

  const handleGenerate = () => {
    if (inputText.trim()) {
      onGenerate(inputText);
    }
  };

  const handleExampleClick = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 className="text-section mb-4">
        CREATE DISPATCHES
      </h2>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('freetext')}
          className={`btn-toggle flex-1 ${activeTab === 'freetext' ? 'active' : ''}`}
          style={{ padding: '0.75rem 1rem' }}
        >
          FREE TEXT
        </button>
        <button
          onClick={() => setActiveTab('prescription')}
          className={`btn-toggle flex-1 ${activeTab === 'prescription' ? 'active' : ''}`}
          style={{ padding: '0.75rem 1rem' }}
        >
          PRESCRIPTION
        </button>
      </div>

      {activeTab === 'freetext' ? (
        <>
          <div className="mb-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your delivery needs in plain English..."
              className="textarea"
              style={{ height: '160px' }}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !inputText.trim()}
            className="btn btn-primary w-full"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
              'GENERATE DISPATCHES'
            )}
          </button>

          <div className="mt-6">
            <h3 className="text-label mb-3">
              TRY AN EXAMPLE
            </h3>
            <div className="space-y-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example.text)}
                  disabled={isLoading}
                  className="w-full text-left transition-all duration-200 disabled:opacity-50"
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--grey-input)',
                    borderRadius: '0'
                  }}
                >
                  <span className="text-micro" style={{ color: 'var(--blue)' }}>
                    {example.title}
                  </span>
                  <p className="text-small mt-1" style={{ lineHeight: '1.4' }}>
                    {example.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <PrescriptionUpload
          onConvert={onPrescriptionConvert}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
