import { Schema, model, Document, Types } from 'mongoose';

/**
 * One vectorized slice of an uploaded document. The `embedding` field is
 * what MongoDB Atlas Vector Search indexes; local/self-hosted MongoDB can
 * still serve searches via the brute-force cosine fallback in
 * MongoAtlasVectorStore (no index required).
 *
 * Chunks are deleted when their parent document is deleted, and every
 * retrieval filters on `user`, so a user can never see another user's
 * chunks even if a search index misbehaves.
 */
export interface IDocumentChunk extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  document: Types.ObjectId;
  /** Position within the parent document (0-based), for ordering/citations. */
  index: number;
  content: string;
  embedding: number[];
  /** Approximate page the chunk came from, when the extractor knows it. */
  pageNumber?: number;
  tokenCount: number;
  createdAt: Date;
}

const documentChunkSchema = new Schema<IDocumentChunk>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    document: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    index: { type: Number, required: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
    pageNumber: { type: Number },
    tokenCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Fast ownership-scoped lookups (deleteByDocument, user-scoped search).
documentChunkSchema.index({ user: 1, document: 1, index: 1 });

// NOTE: for MongoDB Atlas Vector Search you must create a vector search
// index on this collection (field: `embedding`, dimensions matching your
// embedding model, similarity: cosine) and set VECTOR_SEARCH_INDEX to the
// index name in the environment. See README for the exact index JSON.
export const DocumentChunk = model<IDocumentChunk>('DocumentChunk', documentChunkSchema);
