import { env } from '../config/env';
import { AIProvider, EmbeddingProvider } from './AIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAIEmbeddingProvider } from './providers/OpenAIEmbeddingProvider';

let cachedAIProvider: AIProvider | null = null;
let cachedEmbeddingProvider: EmbeddingProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!cachedAIProvider) {
    switch (env.AI_PROVIDER) {
      case 'anthropic':
      default:
        cachedAIProvider = new AnthropicProvider();
    }
  }
  return cachedAIProvider;
}

export function getEmbeddingProvider(): EmbeddingProvider {
  if (!cachedEmbeddingProvider) {
    switch (env.EMBEDDING_PROVIDER) {
      case 'openai':
      default:
        cachedEmbeddingProvider = new OpenAIEmbeddingProvider();
    }
  }
  return cachedEmbeddingProvider;
}
