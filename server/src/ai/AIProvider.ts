export interface CompletionOptions {
  /** Keep responses deterministic-ish for structured JSON output. */
  temperature?: number;
  maxTokens?: number;
  /** System prompt, kept separate from the user message for clarity. */
  system?: string;
}

export interface AIProvider {
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
}

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}
