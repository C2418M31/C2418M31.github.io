import { z } from "zod";

/**
 * Validated shape of one crowdsourced network reading, after column
 * normalization (see normalizeRow in excel-import.ts). This is the
 * contract both the Excel upload path and the future mobile-fed API
 * path must satisfy before a row becomes a map feature.
 */
export const networkRowSchema = z.object({
  latitude: z.coerce.number().min(-90, "latitude out of range").max(90, "latitude out of range"),
  longitude: z.coerce
    .number()
    .min(-180, "longitude out of range")
    .max(180, "longitude out of range"),
  signal_strength: z.coerce.number(),
  connection_type: z
    .string()
    .trim()
    .min(1, "connection_type is required")
    .transform((v) => v.toUpperCase()),
  // Accepted as any string Date.parse() can understand (ISO 8601
  // preferred), then normalized to a real ISO string below. Missing
  // timestamps are allowed here — ingestNetworkReadings fills in "now" as
  // a default — but a *present, unparseable* value is rejected outright
  // rather than silently stored as garbage, since several features
  // (freshness badges, time decay, trend/anomaly detection) depend on
  // this being a real date.
  timestamp: z
    .string()
    .trim()
    .optional()
    .refine((v) => v === undefined || !Number.isNaN(Date.parse(v)), {
      message: "timestamp is not a valid date",
    })
    .transform((v) => (v === undefined ? undefined : new Date(v).toISOString())),
  location_name: z.string().trim().optional(),
  mobile_number: z.string().trim().optional(),
  // Optional dual-SIM slot. Not part of the current Excel template, but
  // accepted if present so no schema change is needed when it starts
  // showing up in mobile-sourced data.
  sim_slot: z
    .union([z.literal(1), z.literal(2), z.literal("1"), z.literal("2")])
    .transform((v) => (v === undefined ? undefined : (Number(v) as 1 | 2)))
    .optional(),
});

export type NetworkRow = z.infer<typeof networkRowSchema>;

export interface RowIssue {
  /** 1-based row number as it appears in the source spreadsheet (header excluded). */
  row: number;
  message: string;
}
