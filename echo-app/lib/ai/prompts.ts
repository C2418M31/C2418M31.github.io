import type { AnalyzeInput, ChatContext, ChatHistoryMessage } from "./types";

const CITY_CENTERS = `Manila [121.0, 14.6], Cebu [123.8967, 10.3157], Davao [125.6131, 7.0722], Baguio [120.596, 16.4023], Iloilo [122.5621, 10.7202]`;

export function buildAnalyzePrompt(input: AnalyzeInput): string {
  const responseContract = `Respond with ONLY a JSON object, no markdown fences, no extra text, matching this TypeScript type:
{"quality": "Good" | "Slow" | "No Connection" | "No Data", "summary": string, "recommendation": string, "priority"?: "Low" | "Medium" | "High"}

Base "quality" strictly on the given score: >=0.6 is "Good", >=0.3 is "Slow", below 0.3 is "No Connection". Use "No Data" ONLY when told explicitly that there are zero reports — never infer it yourself, and never use it for a subscriber or area that has an actual score. Write a 1-2 sentence summary and a concrete, actionable recommendation for a network operations team. Include "priority" (how urgently ops should act on this) when analyzing an area or region; you may omit it for a single subscriber.`;

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

  if (input.kind === "area") {
    return `You are a telecom network operations analyst. Analyze this geographic area's aggregate connection quality.

Area data:
- Location: ${input.locationName}
- Coordinates: ${input.coordinates.join(", ")}
- Users within 10km: ${input.userCount}
- Average normalized network score (0-1): ${input.avgScore.toFixed(2)}
- Connection type mix: ${JSON.stringify(input.connectionMix)}

${responseContract}`;
  }

  // input.kind === "region": a clicked administrative boundary cell
  // (province/city/barangay), not a fixed-radius circle like "area".
  const sampleSizeNote =
    input.pointCount === 0
      ? `No crowdsource reports exist for this ${input.level} yet. Say plainly that there is no data — do not guess at a quality level or invent a recommendation beyond "collect more reports here."`
      : input.pointCount < 5
        ? `Only ${input.pointCount} crowdsource report(s) cover this ${input.level}. Explicitly caveat the summary as low-confidence due to small sample size — do not state conclusions as if they were well-established.`
        : `${input.pointCount} crowdsource reports cover this ${input.level}, a reasonable sample.`;

  return `You are a telecom network operations analyst. Analyze this administrative boundary cell's aggregate connection quality, from crowdsourced subscriber reports.

Region data:
- Name: ${input.name} (${input.level})
- PSGC code: ${input.psgcCode}
- Crowdsource reports: ${input.pointCount}
- Average normalized network score (0-1): ${input.avgScore != null ? input.avgScore.toFixed(2) : "N/A (no reports)"}
- Connection type mix: ${JSON.stringify(input.connectionMix)}

Sample size guidance: ${sampleSizeNote}

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
    | { "type": "setView", "mode": "points" | "heatmap" | "choropleth-grid" | "choropleth-admin", "adminLevel"?: "province" | "city" | "barangay" }
    | { "type": "none" }
}

Known Philippine city centers you may use for flyTo: ${CITY_CENTERS}.
Only include a flyTo/resetView action when the user's message clearly asks for map navigation (e.g. "go to Cebu", "reset the view", "zoom out"). Otherwise use {"type":"none"}.

Use "setView" when the user asks to switch how the map is displayed, e.g. "show me the heatmap", "switch to points", "show the boundary/choropleth view". "choropleth-grid" is a hex-grid aggregation; "choropleth-admin" is real province/city/barangay boundaries — if the user says "boundaries", "barangays", "provinces", or "administrative areas", use "choropleth-admin" with adminLevel set to whichever level they named (default "province" if unspecified). IMPORTANT: you cannot jump straight to a specific named city or barangay — that requires the user to click it on the map after switching to the boundary view. If asked to "show me Quezon City's barangays" directly, say so in your reply and set adminLevel to "province" as the starting point, not "barangay".

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
