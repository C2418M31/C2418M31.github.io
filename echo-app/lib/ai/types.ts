import type { NetworkProperties } from "@/lib/geo/types";

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

export type AnalyzeInput = AnalyzeUserInput | AnalyzeAreaInput;

export interface AnalyzeResult {
  quality: "Good" | "Slow" | "No Connection";
  summary: string;
  recommendation: string;
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
