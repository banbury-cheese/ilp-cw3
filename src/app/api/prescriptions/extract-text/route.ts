import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { NextRequest, NextResponse } from 'next/server';

// Increase timeout for OCR processing
export const maxDuration = 60; // 60 seconds
export const runtime = 'nodejs';

const require = createRequire(import.meta.url);

let pdfWorkerSrc: string | null = null;
try {
  const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  pdfWorkerSrc = pathToFileURL(workerPath).href;
} catch (workerResolveError) {
  console.warn('Could not resolve pdf.js worker file. PDF parsing may fail.', workerResolveError);
}

let pdfWorkerConfigured = false;

const ensurePdfWorker = (PDFParseClass: typeof import('pdf-parse')['PDFParse']) => {
  if (pdfWorkerConfigured || !pdfWorkerSrc) {
    return;
  }

  try {
    PDFParseClass.setWorker(pdfWorkerSrc);
    pdfWorkerConfigured = true;
    console.log(`pdf.js worker configured: ${pdfWorkerSrc}`);
  } catch (workerConfigError) {
    console.warn('Failed to set pdf.js worker source, continuing with defaults.', workerConfigError);
  }
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', details: 'No file uploaded' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const warnings: string[] = [];
    let text = '';

    console.log(`Processing file: ${fileName}, type: ${file.type}, size: ${file.size}`);

    // Handle different file types
    if (fileName.endsWith('.txt')) {
      // Plain text file
      text = await file.text();
    } else if (fileName.endsWith('.pdf')) {
      // PDF file - Use pdf-parse which handles worker setup automatically
      try {
        console.log('Loading pdf-parse...');
        const { PDFParse } = await import('pdf-parse');

        if (typeof PDFParse !== 'function') {
          throw new Error('pdf-parse module did not provide the PDFParse class');
        }

        ensurePdfWorker(PDFParse);

        const buffer = Buffer.from(await file.arrayBuffer());

        console.log('PDF buffer created, size:', buffer.length);

        // Parse the PDF using the v2 API
        console.log('Parsing PDF...');
        const parser = new PDFParse({ data: buffer });

        try {
          const result = await parser.getText();
          text = result?.text || '';
        } finally {
          await parser.destroy();
        }

        console.log('PDF parsed, text length:', text.length);

        if (!text.trim()) {
          warnings.push('PDF appears to contain no extractable text. It may be a scanned document.');
        }
      } catch (pdfError: unknown) {
        const pdfMessage = pdfError instanceof Error ? pdfError.message : 'Unknown error';
        const pdfStack = pdfError instanceof Error ? pdfError.stack : undefined;
        console.error('PDF parsing error:', pdfError);
        if (pdfStack) {
          console.error('Error stack:', pdfStack);
        }
        throw new Error(`PDF parsing failed: ${pdfMessage}`);
      }
    } else if (
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg')
    ) {
      // Image file - Use simpler Tesseract approach
      console.log('Starting OCR for image...');

      try {
        const { createWorker } = await import('tesseract.js');
        const buffer = Buffer.from(await file.arrayBuffer());

        console.log('Creating Tesseract worker...');

        const worker = await createWorker('eng', 1, {
          logger: (m: { status?: string; progress?: number }) => {
            if (m.status === 'recognizing text' && m.progress !== undefined) {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });

        console.log('Worker created, recognizing text...');

        const { data } = await worker.recognize(buffer);

        console.log('Recognition complete, confidence:', data.confidence);

        text = data.text;

        // Check confidence
        const confidence = data.confidence;
        if (confidence < 60) {
          warnings.push(`OCR confidence is low (${confidence.toFixed(0)}%). Text may be inaccurate.`);
        } else if (confidence < 80) {
          warnings.push(`OCR confidence is moderate (${confidence.toFixed(0)}%). Some text may be incorrect.`);
        }

        if (!text.trim()) {
          warnings.push('Could not extract any text from image. Image may be too small or unclear.');
        }

        await worker.terminate();
        console.log('OCR complete');
      } catch (ocrError: unknown) {
        const ocrMessage = ocrError instanceof Error ? ocrError.message : 'Unknown error';
        const ocrStack = ocrError instanceof Error ? ocrError.stack : undefined;
        console.error('OCR error:', ocrError);
        if (ocrStack) {
          console.error('Error stack:', ocrStack);
        }
        throw new Error(`OCR failed: ${ocrMessage}`);
      }
    } else {
      return NextResponse.json(
        {
          error: 'UNSUPPORTED_FILE',
          details: 'File type not supported. Please upload .txt, .pdf, .png, .jpg, or .jpeg'
        },
        { status: 400 }
      );
    }

    // Clean up the text
    text = text.trim();

    if (!text) {
      warnings.push('No text could be extracted from the file.');
    }

    console.log(`Extraction successful, text length: ${text.length}`);

    return NextResponse.json({
      text,
      warnings: warnings.length > 0 ? warnings : undefined
    });

  } catch (error: unknown) {
    const rootMessage = error instanceof Error ? error.message : 'Failed to extract text from file';
    const rootStack = error instanceof Error ? error.stack : undefined;
    console.error('Error extracting text:', error);
    if (rootStack) {
      console.error('Error stack:', rootStack);
    }
    return NextResponse.json(
      {
        error: 'EXTRACTION_ERROR',
        details: rootMessage
      },
      { status: 500 }
    );
  }
}
