import type { AdminLevel, NetworkProperties, ViewMode } from "@/lib/geo/types";

export interface AnalyzeUserInput {
  kind: "user";
  coordinates: [number, number];
  properties: NetworkProperties;
}

export interface AnalyzeAreaInput {
  kind: "area";
  coordinates: [number, number];
  locationName: string;
  userCount: number;
  avgScore: number;
  connectionMix: Record<string, number>;
}

/** A clicked administrative boundary cell (province/city/barangay choropleth). */
export interface AnalyzeRegionInput {
  kind: "region";
  psgcCode: number;
  name: string;
  level: AdminLevel;
  pointCount: number;
  avgScore: number | null;
  connectionMix: Record<string, number>;
}

export type AnalyzeInput = AnalyzeUserInput | AnalyzeAreaInput | AnalyzeRegionInput;

export interface AnalyzeResult {
  /**
   * "No Data" is only expected for kind: "region" cells with zero
   * crowdsource reports — distinct from "No Connection", which means
   * reports came in and they were bad. Conflating the two would make an
   * unreported area look identical to a confirmed dead zone.
   */
  quality: "Good" | "Slow" | "No Connection" | "No Data";
  summary: string;
  recommendation: string;
  /**
   * Ops triage priority. Optional so existing "user"/"area" callers that
   * don't need it keep working — most useful for "region" analysis, where
   * an operator is deciding what to act on first.
   */
  priority?: "Low" | "Medium" | "High";
}

export interface ChatContext {
  mapCenter: [number, number];
  currentZoom: number;
  featureSummary: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatAction =
  | {
      type: "flyTo";
      center: [number, number];
      zoom?: number;
      pitch?: number;
      bearing?: number;
    }
  | { type: "resetView" }
  /**
   * Switches the map's view mode and, when moving into the boundary
   * choropleth, optionally its admin level. Note this can only reset the
   * boundary level to "province" (nationwide) — it can't jump straight to
   * a specific city or barangay by name, since that would need a
   * name-to-PSGC lookup that doesn't exist yet. The chat prompt is told
   * this explicitly so it doesn't promise more than it can do.
   */
  | { type: "setView"; mode: ViewMode; adminLevel?: AdminLevel }
  | { type: "none" };

export interface ChatResult {
  reply: string;
  action: ChatAction;
}

export interface QueryFilter {
  connectionTypes?: string[];
  minScore?: number;
  maxScore?: number;
  explanation: string;
}

export interface AIProvider {
  name: string;
  analyzeNetwork(input: AnalyzeInput): Promise<AnalyzeResult>;
  chat(
    message: string,
    history: ChatHistoryMessage[],
    context: ChatContext,
  ): Promise<ChatResult>;
  parseQuery(query: string): Promise<QueryFilter>;
}
