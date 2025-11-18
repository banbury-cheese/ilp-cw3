import { NextRequest, NextResponse } from 'next/server';

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

    // Handle different file types
    if (fileName.endsWith('.txt')) {
      // Plain text file
      text = await file.text();
    } else if (fileName.endsWith('.pdf')) {
      // PDF file
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;

      if (!text.trim()) {
        warnings.push('PDF appears to contain no extractable text. It may be a scanned document.');
      }
    } else if (
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg')
    ) {
      // Image file - use Tesseract OCR
      const Tesseract = await import('tesseract.js');
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await Tesseract.recognize(buffer, 'eng', {
        logger: () => {} // Suppress logging
      });

      text = result.data.text;

      // Check confidence
      const confidence = result.data.confidence;
      if (confidence < 60) {
        warnings.push(`OCR confidence is low (${confidence.toFixed(0)}%). Text may be inaccurate.`);
      } else if (confidence < 80) {
        warnings.push(`OCR confidence is moderate (${confidence.toFixed(0)}%). Some text may be incorrect.`);
      }

      if (!text.trim()) {
        warnings.push('Could not extract any text from image. Image may be too small or unclear.');
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

    return NextResponse.json({
      text,
      warnings: warnings.length > 0 ? warnings : undefined
    });

  } catch (error) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      {
        error: 'EXTRACTION_ERROR',
        details: error instanceof Error ? error.message : 'Failed to extract text from file'
      },
      { status: 500 }
    );
  }
}
