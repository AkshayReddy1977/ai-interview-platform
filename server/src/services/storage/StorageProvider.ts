export interface UploadedFileRef {
  /** Storage key/path used to retrieve the file later (not a public URL). */
  key: string;
  /** Size in bytes, as actually stored. */
  size: number;
  /** MIME type as provided at upload time. */
  mimeType: string;
}

export interface StorageProvider {
  /**
   * Persists a file buffer under a namespaced key and returns a reference
   * to it. Callers should never construct keys by hand — use
   * buildKey() below so ownership prefixes stay consistent.
   */
  upload(key: string, buffer: Buffer, mimeType: string): Promise<UploadedFileRef>;

  /** Retrieves the raw file contents for a given key. */
  download(key: string): Promise<Buffer>;

  /** Permanently removes a file. Safe to call on a non-existent key. */
  delete(key: string): Promise<void>;

  /**
   * Returns a URL the client can use to fetch the file directly.
   * For local storage this is a signed, time-limited app route;
   * for S3/R2 this would be a pre-signed URL. Never a permanent
   * public link — resumes are private user data.
   */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

/**
 * Builds a storage key namespaced by user, so one user's files can never
 * collide with or be guessed from another's, and so bulk deletion by
 * user is a simple prefix operation.
 */
export function buildStorageKey(userId: string, category: 'resumes' | 'documents', originalFilename: string): string {
  const safeName = originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${category}/${userId}/${unique}-${safeName}`;
}
