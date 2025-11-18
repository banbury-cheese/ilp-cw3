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
        className="text-center cursor-pointer transition-colors duration-200"
        style={{
          border: `2px dashed ${file ? 'var(--color-primary-muted)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          background: file ? 'var(--color-primary-soft)' : 'transparent'
        }}
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
            <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24">
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
            <p className="text-body">Extracting text...</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="h-8 w-8" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-main)' }}>{file.name}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Click to upload a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg className="h-10 w-10" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                Drop prescription file here
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                or click to browse
              </p>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Supports .txt, .pdf, .png, .jpg
            </p>
          </div>
        )}
      </div>

      {/* Extraction error */}
      {extractError && (
        <div
          style={{
            padding: 'var(--space-3)',
            background: 'var(--color-danger-soft)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-danger)'
          }}
        >
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>{extractError}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div
          style={{
            padding: 'var(--space-3)',
            background: 'var(--color-warning-soft)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-warning)'
          }}
        >
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)' }} className="space-y-1">
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
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
            <label className="text-label">
              Recognised prescription text
            </label>
            <button
              onClick={handleClear}
              className="hover:opacity-70 transition-opacity"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
            >
              Clear
            </button>
          </div>
          <textarea
            value={extractedText}
            readOnly
            className="input resize-none"
            style={{
              height: '128px',
              background: 'var(--color-bg)'
            }}
          />
        </div>
      )}

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={isLoading || !extractedText.trim()}
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
            Converting...
          </>
        ) : (
          'Convert to Dispatches'
        )}
      </button>
    </div>
  );
}
