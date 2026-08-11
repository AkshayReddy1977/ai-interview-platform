import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { AIProvider, CompletionOptions } from '../AIProvider';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.AI_API_KEY });
  }

  async generateCompletion(prompt: string, options: CompletionOptions = {}): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: env.AI_MODEL,
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.4,
        system: options.system,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw AppError.internal('AI provider returned no text content');
      }
      return textBlock.text;
    } catch (error) {
      logger.error('Anthropic API call failed', { error: (error as Error).message });
      throw AppError.internal('AI service is temporarily unavailable');
    }
  }
}
