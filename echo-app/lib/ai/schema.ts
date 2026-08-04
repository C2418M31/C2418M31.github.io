import { z } from "zod";

export const analyzeResultSchema = z.object({
  quality: z.enum(["Good", "Slow", "No Connection"]),
  summary: z.string(),
  recommendation: z.string(),
});

const chatActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("flyTo"),
    center: z.tuple([z.number(), z.number()]),
    zoom: z.number().optional(),
    pitch: z.number().optional(),
    bearing: z.number().optional(),
  }),
  z.object({ type: z.literal("resetView") }),
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
