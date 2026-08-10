import { ZodSchema } from 'zod';
import { getAIProvider } from './ai.factory';
import { CompletionOptions } from './AIProvider';
import { logger } from '../utils/logger';

/**
 * Strips common LLM output artifacts (markdown code fences, leading/
 * trailing prose) before attempting JSON.parse.
 */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const firstBrace = candidate.indexOf('{');
  const firstBracket = candidate.indexOf('[');
  const start =
    firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start === -1) return candidate.trim();
  return candidate.slice(start).trim();
}

/**
 * Calls the AI provider expecting strict JSON matching `schema`. If the
 * first response is malformed, it retries once with the parse error fed
 * back to the model so it can self-correct — after that, throws rather
 * than silently returning something unvalidated. Callers should always
 * have a non-AI fallback path for cases where this ultimately fails
 * (see JobAnalysisService for an example).
 */
export async function generateStructured<T>(
  prompt: string,
  schema: ZodSchema<T>,
  options?: CompletionOptions
): Promise<T> {
  const provider = getAIProvider();
  const jsonInstruction =
    '\n\nRespond with ONLY valid JSON matching the required schema. No markdown code fences, no explanation, no preamble — the entire response must be parseable JSON.';

  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const fullPrompt =
      attempt === 0
        ? prompt + jsonInstruction
        : `${prompt}${jsonInstruction}\n\nYour previous response failed validation with this error: "${lastError}". Fix it and respond with corrected JSON only.`;

    const raw = await provider.generateCompletion(fullPrompt, options);
    const jsonText = extractJson(raw);

    try {
      const parsed = JSON.parse(jsonText);
      const result = schema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
      lastError = JSON.stringify(result.error.flatten());
    } catch (error) {
      lastError = (error as Error).message;
    }

    logger.warn('AI structured output validation failed, retrying', { attempt, error: lastError });
  }

  throw new Error(`AI returned invalid structured output after retry: ${lastError}`);
}
