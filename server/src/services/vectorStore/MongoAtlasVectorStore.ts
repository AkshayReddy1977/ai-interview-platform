import { DocumentChunk, IDocumentChunk } from '../../models/DocumentChunk.model';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { VectorChunkInput, VectorSearchOptions, VectorSearchResult, VectorStore } from './VectorStore';

/**
 * MongoDB-backed vector store.
 *
 * Two search paths:
 * 1. When VECTOR_SEARCH_INDEX is set (a real Atlas Vector Search index
 *    exists on DocumentChunk.embedding), use the $vectorSearch pipeline —
 *    fast, scalable, the production path.
 * 2. Otherwise (local Mongo, or Atlas without the index configured) fall
 *    back to an ownership-scoped scan with cosine similarity computed in
 *    JS. Fine for personal-scale corpora (thousands of chunks); used so
 *    the whole RAG pipeline works in development with zero extra setup.
 *
 * All queries filter on `user` first, so cross-user leakage is impossible
 * regardless of which path runs.
 */
export class MongoAtlasVectorStore implements VectorStore {
  async upsert(chunks: VectorChunkInput[]): Promise<void> {
    if (chunks.length === 0) return;

    // Batch inserts to keep individual Mongo writes reasonable.
    for (let i = 0; i < chunks.length; i += 100) {
      const batch = chunks.slice(i, i + 100);
      await DocumentChunk.insertMany(
        batch.map((c) => ({
          _id: c.chunkId,
          user: c.userId,
          document: c.documentId,
          index: c.index,
          content: c.content,
          embedding: c.embedding,
          pageNumber: c.pageNumber,
          tokenCount: Math.ceil(c.content.length / 4),
        }))
      );
    }
  }

  async deleteByDocument(documentId: string, userId: string): Promise<void> {
    await DocumentChunk.deleteMany({ document: documentId, user: userId });
  }

  async search(queryEmbedding: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const matchFilter: Record<string, unknown> = { user: options.userId };
    if (options.documentIds && options.documentIds.length > 0) {
      matchFilter.document = { $in: options.documentIds };
    }

    if (env.VECTOR_SEARCH_INDEX) {
      try {
        return await this.searchWithVectorIndex(queryEmbedding, matchFilter, options.topK);
      } catch (error) {
        logger.warn('$vectorSearch failed, falling back to brute-force cosine', {
          error: (error as Error).message,
        });
      }
    }

    return this.searchBruteForce(queryEmbedding, matchFilter, options.topK);
  }

  private async searchWithVectorIndex(
    queryEmbedding: number[],
    matchFilter: Record<string, unknown>,
    topK: number
  ): Promise<VectorSearchResult[]> {
    const results = await DocumentChunk.aggregate<IDocumentChunk & { score: number }>([
      {
        $vectorSearch: {
          index: env.VECTOR_SEARCH_INDEX,
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: Math.min(topK * 10, 200),
          limit: topK,
          filter: matchFilter,
        },
      },
      { $project: { _id: 1, user: 1, document: 1, index: 1, content: 1, pageNumber: 1, score: { $meta: 'vectorSearchScore' } } },
    ]);

    return results.map((r) => ({
      chunkId: r._id.toString(),
      documentId: r.document.toString(),
      userId: r.user.toString(),
      index: r.index,
      content: r.content,
      pageNumber: r.pageNumber,
      score: r.score,
    }));
  }

  private async searchBruteForce(
    queryEmbedding: number[],
    matchFilter: Record<string, unknown>,
    topK: number
  ): Promise<VectorSearchResult[]> {
    const candidates = await DocumentChunk.find(matchFilter)
      .select('_id user document index content pageNumber embedding')
      .limit(2000)
      .lean();

    const scored = candidates
      .map((chunk) => ({
        chunkId: chunk._id.toString(),
        documentId: chunk.document.toString(),
        userId: chunk.user.toString(),
        index: chunk.index,
        content: chunk.content,
        pageNumber: chunk.pageNumber,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.filter((r) => Number.isFinite(r.score));
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function assertVectorSearchConfigured(): void {
  if (!env.EMBEDDING_API_KEY) {
    throw AppError.internal('Embedding service is not configured (EMBEDDING_API_KEY missing)');
  }
}
