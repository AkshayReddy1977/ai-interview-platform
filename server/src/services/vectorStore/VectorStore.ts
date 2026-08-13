/**
 * Vector store abstraction. Controllers and RAG services depend only on
 * this interface — swapping MongoDB Atlas Vector Search for Pinecone,
 * Qdrant, or anything else is a factory change, not a code change.
 *
 * Security contract: every method takes the owning `userId` (or a chunk
 * that carries it) and MUST scope all reads/writes to it. The RAG layer
 * additionally verifies document ownership before calling search(), but
 * the store itself never trusts that — defense in depth.
 */
export interface VectorChunkInput {
  /** The Mongo ObjectId of the DocumentChunk document. */
  chunkId: string;
  documentId: string;
  userId: string;
  index: number;
  content: string;
  pageNumber?: number;
  embedding: number[];
}

export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  userId: string;
  index: number;
  content: string;
  pageNumber?: number;
  /** Similarity score (cosine similarity, higher = more relevant). */
  score: number;
}

export interface VectorSearchOptions {
  /** Only chunks owned by this user are ever considered. */
  userId: string;
  /** Restrict the search to these documents (already ownership-verified). */
  documentIds?: string[];
  topK: number;
}

export interface VectorStore {
  upsert(chunks: VectorChunkInput[]): Promise<void>;

  /** Removes every chunk of one document (used on document delete). */
  deleteByDocument(documentId: string, userId: string): Promise<void>;

  search(queryEmbedding: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]>;
}
