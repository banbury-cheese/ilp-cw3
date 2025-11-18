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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Create Dispatches
      </h2>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('freetext')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors duration-200 ${
            activeTab === 'freetext'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Free Text
        </button>
        <button
          onClick={() => setActiveTab('prescription')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors duration-200 ${
            activeTab === 'prescription'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Prescription Upload
        </button>
      </div>

      {activeTab === 'freetext' ? (
        <>
          <div className="mb-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your delivery needs in plain English...

Example: 'Deliver 2kg of insulin that needs cooling to the Royal Infirmary tomorrow at 2pm'"
              className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
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

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 mb-3">
              Try an example
            </h3>
            <div className="space-y-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example.text)}
                  disabled={isLoading}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <span className="text-sm font-medium text-indigo-600">
                    {example.title}
                  </span>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
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
