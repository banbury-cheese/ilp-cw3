'use client';

import { useState, useRef } from 'react';

interface PrescriptionUploadProps {
  onConvert: (text: string) => void;
  isLoading: boolean;
}

export default function PrescriptionUpload({
  onConvert,
  isLoading
}: PrescriptionUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setExtractError(null);
    setWarnings([]);
    setExtractedText('');
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/prescriptions/extract-text', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to extract text');
      }

      const result = await response.json();
      setExtractedText(result.text || '');
      setWarnings(result.warnings || []);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed to extract text');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleConvert = () => {
    if (extractedText.trim()) {
      onConvert(extractedText);
    }
  };

  const handleClear = () => {
    setFile(null);
    setExtractedText('');
    setWarnings([]);
    setExtractError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-colors duration-200
          ${file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.png,.jpg,.jpeg"
          onChange={handleInputChange}
          className="hidden"
        />

        {isExtracting ? (
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24">
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
            <p className="text-sm text-gray-600">Extracting text...</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">Click to upload a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drop prescription file here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Supports .txt, .pdf, .png, .jpg
            </p>
          </div>
        )}
      </div>

      {/* Extraction error */}
      {extractError && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">{extractError}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <ul className="text-xs text-amber-700 space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Extracted text preview */}
      {extractedText && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Recognised prescription text
            </label>
            <button
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <textarea
            value={extractedText}
            readOnly
            className="w-full h-32 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 resize-none"
          />
        </div>
      )}

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={isLoading || !extractedText.trim()}
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
            Converting...
          </>
        ) : (
          'Convert to Dispatches'
        )}
      </button>
    </div>
  );
}
