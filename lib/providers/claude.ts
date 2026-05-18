import { createAnthropic } from "@ai-sdk/anthropic";
import { gateway } from "ai";
import type { LanguageModel } from "ai";

/**
 * Slug convention differs by transport:
 *  - Vercel AI Gateway : dotted version, provider-prefixed (preferred here)
 *  - Anthropic API/SDK : hyphened version, no prefix
 * ITINERARY_MODEL is stored in gateway (dotted) form; converted for the
 * direct Anthropic path because that SDK only accepts the hyphened id.
 */
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.6";

function toAnthropicId(slug: string): string {
  return slug.replace(/^anthropic\//, "").replace(/(\d)\.(\d)/g, "$1-$2");
}

/**
 * Resolve the itinerary model. Auth precedence:
 *  1. Vercel OIDC token (zero-rotation, auto on Vercel) → Gateway
 *  2. AI_GATEWAY_API_KEY                                 → Gateway
 *  3. ANTHROPIC_API_KEY  (portable off-Vercel fallback)  → direct Anthropic
 *  4. none                                               → null → template engine
 */
export function getItineraryModel(): LanguageModel | null {
  const slug = process.env.ITINERARY_MODEL || DEFAULT_MODEL;

  if (process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY) {
    return gateway(slug.includes("/") ? slug : `anthropic/${slug}`);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropic(toAnthropicId(slug));
  }
  return null;
}

export function hasClaude(): boolean {
  return Boolean(
    process.env.VERCEL_OIDC_TOKEN ||
    process.env.AI_GATEWAY_API_KEY ||
    process.env.ANTHROPIC_API_KEY,
  );
}
