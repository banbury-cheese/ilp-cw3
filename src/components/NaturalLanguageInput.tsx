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
    title: 'Cooling Required',
    text: 'Deliver 2kg of insulin that needs cooling to the Royal Infirmary tomorrow at 2pm'
  },
  {
    title: 'Heating Required',
    text: 'Send 500g of warm blood samples to Western General Hospital today around 4pm, keep them heated'
  },
  {
    title: 'Multiple Deliveries',
    text: 'Tomorrow morning: 1kg of vaccines (refrigerated) to Sick Kids, and in the afternoon send 750g of medication to Marchmont. Try to keep cost under £50.'
  },
  {
    title: 'Basic Delivery',
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
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <h2 className="text-title" style={{ marginBottom: 'var(--space-4)' }}>
        Create Dispatches
      </h2>

      {/* Tab switcher */}
      <div className="flex gap-2" style={{ marginBottom: 'var(--space-4)' }}>
        <button
          onClick={() => setActiveTab('freetext')}
          className="flex-1 transition-colors duration-200"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'freetext' ? 'var(--color-primary-soft)' : 'var(--color-bg)',
            color: activeTab === 'freetext' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
          }}
        >
          Free Text
        </button>
        <button
          onClick={() => setActiveTab('prescription')}
          className="flex-1 transition-colors duration-200"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'prescription' ? 'var(--color-primary-soft)' : 'var(--color-bg)',
            color: activeTab === 'prescription' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
          }}
        >
          Prescription Upload
        </button>
      </div>

      {activeTab === 'freetext' ? (
        <>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your delivery needs in plain English...

Example: 'Deliver 2kg of insulin that needs cooling to the Royal Infirmary tomorrow at 2pm'"
              className="input resize-none"
              style={{ height: '160px' }}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !inputText.trim()}
            className="btn btn-primary w-full"
            style={{ borderRadius: 'var(--radius-lg)' }}
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
                Generating...
              </>
            ) : (
              'Generate Dispatches'
            )}
          </button>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <h3 className="text-label" style={{ marginBottom: 'var(--space-3)' }}>
              Try an example
            </h3>
            <div className="space-y-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example.text)}
                  disabled={isLoading}
                  className="w-full text-left transition-colors duration-200 disabled:opacity-50"
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-primary)' }}>
                    {example.title}
                  </span>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }} className="line-clamp-2">
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
