import type { AnalyzeInput, ChatContext, ChatHistoryMessage } from "./types";

const CITY_CENTERS = `Manila [121.0, 14.6], Cebu [123.8967, 10.3157], Davao [125.6131, 7.0722], Baguio [120.596, 16.4023], Iloilo [122.5621, 10.7202]`;

export function buildAnalyzePrompt(input: AnalyzeInput): string {
  const responseContract = `Respond with ONLY a JSON object, no markdown fences, no extra text, matching this TypeScript type:
{"quality": "Good" | "Slow" | "No Connection", "summary": string, "recommendation": string}

Base "quality" strictly on the given score: >=0.6 is "Good", >=0.3 is "Slow", below 0.3 is "No Connection". Write a 1-2 sentence summary and a concrete, actionable recommendation for a network operations team.`;

  if (input.kind === "user") {
    const p = input.properties;
    return `You are a telecom network operations analyst. Analyze this single subscriber's connection.

Subscriber data:
- Location: ${p.location_name}
- Coordinates: ${input.coordinates.join(", ")}
- Mobile number: ${p.mobile_number ?? "unknown"}
- Connection type: ${p.connection_type}
- Signal strength: ${p.signal_strength} dBm
- Normalized network score (0-1): ${p.network_score.toFixed(2)}

${responseContract}`;
  }

  return `You are a telecom network operations analyst. Analyze this geographic area's aggregate connection quality.

Area data:
- Location: ${input.locationName}
- Coordinates: ${input.coordinates.join(", ")}
- Users within 10km: ${input.userCount}
- Average normalized network score (0-1): ${input.avgScore.toFixed(2)}
- Connection type mix: ${JSON.stringify(input.connectionMix)}

${responseContract}`;
}

export function buildChatPrompt(
  message: string,
  history: ChatHistoryMessage[],
  context: ChatContext,
): string {
  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n");

  return `You are the assistant embedded in a telecom network intelligence map dashboard ("Network Intelligence Hub"). You can chat naturally AND optionally trigger one map action per response.

Current map state: center ${context.mapCenter.join(", ")}, zoom ${context.currentZoom}.
Dataset: ${context.featureSummary}

Respond with ONLY a JSON object, no markdown fences, no extra text, matching this TypeScript type:
{
  "reply": string,
  "action":
    | { "type": "flyTo", "center": [lng, lat], "zoom"?: number, "pitch"?: number, "bearing"?: number }
    | { "type": "resetView" }
    | { "type": "none" }
}

Known Philippine city centers you may use for flyTo: ${CITY_CENTERS}.
Only include a flyTo/resetView action when the user's message clearly asks for map navigation (e.g. "go to Cebu", "reset the view", "zoom out"). Otherwise use {"type":"none"}.

Conversation so far:
${historyText || "(none yet)"}

User: ${message}`;
}

export function buildQueryPrompt(query: string): string {
  return `You are a query parser for a telecom network map dashboard. Convert the user's natural-language request into a JSON filter.

Respond with ONLY a JSON object, no markdown fences, no extra text, matching this TypeScript type:
{
  "connectionTypes"?: string[],   // any of "5G", "4G", "3G", "None"
  "minScore"?: number,             // 0-1 inclusive lower bound on normalized network score
  "maxScore"?: number,             // 0-1 inclusive upper bound on normalized network score
  "explanation": string            // one sentence describing the filter you applied, shown to the user
}

Guidance: "poor"/"no connection"/"no internet" means maxScore around 0.29. "slow"/"degraded" means minScore 0.3, maxScore 0.59. "good"/"strong" means minScore 0.6. If the user doesn't mention quality, omit minScore/maxScore. If they don't mention a connection type, omit connectionTypes.

User request: "${query}"`;
}
