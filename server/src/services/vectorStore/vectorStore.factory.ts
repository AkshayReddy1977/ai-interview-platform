import { env } from '../../config/env';
import { VectorStore } from './VectorStore';
import { MongoAtlasVectorStore } from './MongoAtlasVectorStore';

let cachedStore: VectorStore | null = null;

/**
 * The only place that reads VECTOR_DB_PROVIDER. Today every supported
 * provider is a Mongo-backed store (Atlas Vector Search or brute-force
 * fallback on the same DocumentChunk collection); the abstraction is what
 * lets Pinecone/Qdrant be dropped in later without touching RAG logic.
 */
export function getVectorStore(): VectorStore {
  if (cachedStore) return cachedStore;

  switch (env.VECTOR_DB_PROVIDER) {
    case 'mongodb-atlas':
    default:
      cachedStore = new MongoAtlasVectorStore();
  }

  return cachedStore;
}
