import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AppError } from '../../utils/AppError';

export enum DocumentType {
  PDF = 'PDF',
  TXT = 'TXT',
  DOCX = 'DOCX',
}

export interface ExtractedText {
  text: string;
  pageCount?: number;
}

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Maps a MIME type (as declared by the client) to a supported document
 * type. Some browsers report text files or docx as application/octet-stream,
 * so the extension is considered when the MIME is ambiguous.
 */
export function detectDocumentType(
  mimeType: string,
  originalFilename: string
): DocumentType | null {
  const ext = originalFilename.split('.').pop()?.toLowerCase() ?? '';

  switch (mimeType) {
    case 'application/pdf':
      return DocumentType.PDF;
    case 'text/plain':
      return DocumentType.TXT;
    case DOCX_MIME:
      return DocumentType.DOCX;
    case 'application/octet-stream':
      if (ext === 'pdf') return DocumentType.PDF;
      if (ext === 'txt') return DocumentType.TXT;
      if (ext === 'docx') return DocumentType.DOCX;
      return null;
    default:
      return null;
  }
}

/**
 * Verifies the file's magic bytes match its declared type, so a client
 * can't smuggle arbitrary content past the MIME/extension checks by
 * mislabeling it (e.g. an executable named "notes.pdf").
 */
export function sniffDocumentType(buffer: Buffer): DocumentType | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-') {
    return DocumentType.PDF;
  }
  // DOCX is a ZIP archive: PK\x03\x04
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return DocumentType.DOCX;
  }
  // Plain text: no magic bytes. Heuristic — reject obvious binary content.
  const sample = buffer.subarray(0, 1024);
  const printableRatio =
    sample.filter((b) => b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b <= 0x7e)).length /
    Math.max(sample.length, 1);
  if (printableRatio > 0.9) {
    return DocumentType.TXT;
  }
  return null;
}

/**
 * Extracts raw text from a document buffer. Throws AppError.badRequest
 * when the content doesn't match the declared type or text can't be read.
 */
export async function extractText(buffer: Buffer, mimeType: string, originalFilename: string): Promise<ExtractedText> {
  const declared = detectDocumentType(mimeType, originalFilename);
  if (!declared) {
    throw AppError.badRequest('Unsupported file type. Only PDF, TXT and DOCX files are allowed.');
  }

  const sniffed = sniffDocumentType(buffer);
  if (sniffed === null || sniffed !== declared) {
    throw AppError.badRequest(`File content does not match its declared type (expected ${declared}).`);
  }

  switch (declared) {
    case DocumentType.PDF: {
      const result = await pdfParse(buffer);
      return { text: result.text, pageCount: result.numpages };
    }
    case DocumentType.TXT: {
      const text = buffer.toString('utf8');
      return { text, pageCount: undefined };
    }
    case DocumentType.DOCX: {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value, pageCount: undefined };
    }
  }
}
