import { z } from "zod";

export const analyzeResultSchema = z.object({
  quality: z.enum(["Good", "Slow", "No Connection", "No Data"]),
  summary: z.string(),
  recommendation: z.string(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
});

// --- AnalyzeInput (the request body /api/analyze receives) ---
// Previously unvalidated: the route cast req.json() straight to AnalyzeInput
// with no runtime check. Adding this closes that gap.
const analyzeUserInputSchema = z.object({
  kind: z.literal("user"),
  coordinates: z.tuple([z.number(), z.number()]),
  properties: z
    .object({
      location_name: z.string(),
      signal_strength: z.number(),
      connection_type: z.string(),
      network_score: z.number(),
      mobile_number: z.string().optional(),
      timestamp: z.string().optional(),
      sim_slot: z.union([z.literal(1), z.literal(2)]).optional(),
    })
    .passthrough(),
});

const analyzeAreaInputSchema = z.object({
  kind: z.literal("area"),
  coordinates: z.tuple([z.number(), z.number()]),
  locationName: z.string(),
  userCount: z.number(),
  avgScore: z.number(),
  connectionMix: z.record(z.number()),
});

const analyzeRegionInputSchema = z.object({
  kind: z.literal("region"),
  psgcCode: z.number(),
  name: z.string(),
  level: z.enum(["province", "city", "barangay"]),
  pointCount: z.number(),
  avgScore: z.number().nullable(),
  connectionMix: z.record(z.number()),
});

export const analyzeInputSchema = z.discriminatedUnion("kind", [
  analyzeUserInputSchema,
  analyzeAreaInputSchema,
  analyzeRegionInputSchema,
]);

const chatActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("flyTo"),
    center: z.tuple([z.number(), z.number()]),
    zoom: z.number().optional(),
    pitch: z.number().optional(),
    bearing: z.number().optional(),
  }),
  z.object({ type: z.literal("resetView") }),
  z.object({
    type: z.literal("setView"),
    mode: z.enum(["points", "heatmap", "choropleth-grid", "choropleth-admin"]),
    adminLevel: z.enum(["province", "city", "barangay"]).optional(),
  }),
  z.object({ type: z.literal("none") }),
]);

export const chatResultSchema = z.object({
  reply: z.string(),
  action: chatActionSchema,
});

export const queryFilterSchema = z.object({
  connectionTypes: z.array(z.string()).optional(),
  minScore: z.number().optional(),
  maxScore: z.number().optional(),
  explanation: z.string(),
});
