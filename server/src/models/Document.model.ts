import { Schema, model, Document, Types } from 'mongoose';

export enum DocumentStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export interface IDocument extends Document {
  _id: Types.ObjectId;
  /** Owner — every query in the document service is scoped to this. */
  user: Types.ObjectId;
  /** Storage key of the original file (never a public URL). */
  storageKey: string;
  /** The stored filename (basename of the storage key). */
  filename: string;
  /** The name the user uploaded. */
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  pageCount?: number;
  textLength?: number;
  chunkCount?: number;
  processingError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storageKey: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.UPLOADING },
    pageCount: { type: Number },
    textLength: { type: Number },
    chunkCount: { type: Number },
    processingError: { type: String },
  },
  { timestamps: true }
);

// Every document list/detail/ownership query is scoped to a user; this
// keeps those fast. Compound index for "user's documents, newest first".
documentSchema.index({ user: 1, createdAt: -1 });

export const Document = model<IDocument>('Document', documentSchema);
