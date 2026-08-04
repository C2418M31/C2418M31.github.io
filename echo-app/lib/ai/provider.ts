import { GeminiProvider } from "./gemini";
import { ClaudeProvider } from "./claude";
import type { AIProvider } from "./types";

let cached: AIProvider | null = null;

/**
 * Both providers can be configured simultaneously (both API keys set);
 * AI_PROVIDER just picks which one actually serves requests.
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const preferred = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  if (preferred === "claude") {
    cached = new ClaudeProvider();
  } else if (preferred === "gemini") {
    cached = new GeminiProvider();
  } else {
    throw new Error(`Unknown AI_PROVIDER "${preferred}". Use "gemini" or "claude".`);
  }

  return cached;
}
