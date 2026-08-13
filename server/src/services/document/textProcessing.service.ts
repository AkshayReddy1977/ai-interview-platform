/**
 * Pure text-processing helpers for document ingestion: cleaning extracted
 * text and splitting it into chunks sized for embedding + retrieval.
 * No I/O, no dependencies on storage/AI — easy to unit test in isolation.
 */

export interface TextChunk {
  content: string;
  /** Page number (1-based) when the extractor could determine it. */
  pageNumber?: number;
}

/** Max characters a single chunk may hold (≈ a few hundred tokens). */
export const MAX_CHUNK_CHARS = 2000;
/** Characters of overlap between adjacent chunks to preserve context. */
export const OVERLAP_CHARS = 200;

const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const MULTI_NEWLINES = /\n{3,}/g;

/**
 * Normalizes extracted text: strips control characters (except \n and \t),
 * collapses runs of blank lines, and trims. Returns a string that is safe
 * to chunk and later feed to an LLM.
 */
export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(MULTI_NEWLINES, '\n\n')
    .trim();
}

/**
 * Rough token estimate: ~4 chars per token for typical English text.
 * Used for chunk sizing metadata, not for billing.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface PageSegments {
  pages: string[];
  hasPageBreaks: boolean;
}

/**
 * pdf-parse embeds form-feed characters between pages in the extracted
 * text. Split on them when present so chunks can carry page numbers.
 */
function splitByPages(cleaned: string): PageSegments {
  if (!cleaned.includes('\f')) {
    return { pages: [cleaned], hasPageBreaks: false };
  }
  const pages = cleaned
    .split('\f')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return { pages, hasPageBreaks: true };
}

/**
 * Splits cleaned text into overlapping chunks of at most MAX_CHUNK_CHARS.
 * Chunk boundaries are aligned to paragraph breaks when possible, and the
 * tail of each chunk (OVERLAP_CHARS) is carried into the next so a
 * retrieval hit keeps some surrounding context.
 *
 * When the extractor gives us page breaks, chunking happens per page and
 * every chunk gets its pageNumber.
 */
export function chunkText(
  text: string,
  options: { maxChunkChars?: number; overlapChars?: number } = {}
): TextChunk[] {
  const maxChunkChars = options.maxChunkChars ?? MAX_CHUNK_CHARS;
  const overlapChars = options.overlapChars ?? OVERLAP_CHARS;
  const { pages, hasPageBreaks } = splitByPages(text);

  const chunks: TextChunk[] = [];
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    const paragraphs = page
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    let buffer = '';
    for (const paragraph of paragraphs) {
      // A single paragraph longer than the cap gets hard-split on word
      // boundaries (keeps tokens/words intact).
      if (paragraph.length > maxChunkChars) {
        if (buffer) {
          chunks.push({ content: buffer, pageNumber: hasPageBreaks ? pageIndex + 1 : undefined });
          buffer = '';
        }
        let remainder = paragraph;
        while (remainder.length > maxChunkChars) {
          let cut = remainder.lastIndexOf(' ', maxChunkChars);
          if (cut < maxChunkChars * 0.5) cut = maxChunkChars; // no good word break — hard cut
          chunks.push({
            content: remainder.slice(0, cut).trim(),
            pageNumber: hasPageBreaks ? pageIndex + 1 : undefined,
          });
          remainder = remainder.slice(Math.max(0, cut - overlapChars)).trim();
        }
        buffer = remainder;
        continue;
      }

      if (buffer && buffer.length + paragraph.length + 2 > maxChunkChars) {
        chunks.push({ content: buffer, pageNumber: hasPageBreaks ? pageIndex + 1 : undefined });
        // Carry the tail of the previous chunk into the next one.
        buffer = buffer.length > overlapChars ? buffer.slice(-overlapChars) + '\n\n' : '';
      }
      buffer += (buffer ? '\n\n' : '') + paragraph;
    }

    if (buffer) {
      chunks.push({ content: buffer, pageNumber: hasPageBreaks ? pageIndex + 1 : undefined });
    }
  }

  return chunks;
}
