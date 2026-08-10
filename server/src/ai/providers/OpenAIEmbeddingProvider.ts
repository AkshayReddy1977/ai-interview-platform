import { env } from '../../config/env';
import { EmbeddingProvider } from '../AIProvider';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

/**
 * Uses fetch directly rather than the openai SDK, to avoid pulling in an
 * extra dependency for a single REST call. Swappable for a different
 * embedding backend by implementing EmbeddingProvider and updating
 * ai.factory.ts — nothing else in the codebase depends on this directly.
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private endpoint = 'https://api.openai.com/v1/embeddings';

  async generateEmbedding(text: string): Promise<number[]> {
    const [embedding] = await this.generateEmbeddings([text]);
    return embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.EMBEDDING_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: env.EMBEDDING_MODEL, input: texts }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API returned ${response.status}`);
      }

      const data = (await response.json()) as { data: { embedding: number[] }[] };
      return data.data.map((d) => d.embedding);
    } catch (error) {
      logger.error('Embedding API call failed', { error: (error as Error).message });
      throw AppError.internal('Embedding service is temporarily unavailable');
    }
  }
}
