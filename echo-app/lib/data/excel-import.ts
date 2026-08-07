import * as XLSX from "xlsx";
import { scoreFeatures } from "@/lib/geo/scoring";
import type { NetworkFeature, NetworkFeatureCollection } from "@/lib/geo/types";
import { networkRowSchema, type RowIssue } from "./schema";

/**
 * Column aliases we accept from an uploaded spreadsheet, keyed by the
 * canonical field name in networkRowSchema. Headers are matched
 * case-insensitively after trimming and collapsing whitespace/underscores,
 * so "Signal (dBm)" and "signal_strength" both resolve to the same field.
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lng", "long", "lon"],
  signal_strength: ["signal_strength", "signal", "rssi", "signaldbm", "signal_dbm"],
  connection_type: ["connection_type", "type", "network_type", "connection", "network"],
  timestamp: ["timestamp", "time", "date", "datetime", "recorded_at", "captured_at"],
  location_name: ["location_name", "location", "area", "place", "city"],
  mobile_number: ["mobile_number", "msisdn", "phone", "number", "subscriber"],
  sim_slot: ["sim_slot", "slot", "sim"],
};

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[\s()./-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Builds a reverse lookup: normalized alias -> canonical field name. */
const ALIAS_TO_FIELD: Record<string, string> = Object.entries(COLUMN_ALIASES).reduce(
  (acc, [field, aliases]) => {
    aliases.forEach((alias) => {
      acc[normalizeKey(alias)] = field;
    });
    return acc;
  },
  {} as Record<string, string>,
);

export function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const field = ALIAS_TO_FIELD[normalizeKey(key)];
    if (field && value !== null && value !== undefined && value !== "") {
      out[field] = value;
    }
  }
  return out;
}

/** Parses the first worksheet of an uploaded .xlsx/.xls file into raw row objects. */
export function parseWorkbookBuffer(buffer: ArrayBuffer): Record<string, unknown>[] {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
}

export interface IngestResult {
  collection: NetworkFeatureCollection;
  errors: RowIssue[];
}

/**
 * Shared ingestion path for a batch of raw readings, regardless of where
 * they came from. Today the only caller is the Excel upload route; once
 * the mobile app reports through a real backend API, that path should
 * call this same function instead of re-implementing validation.
 */
export function ingestNetworkReadings(rawRows: Record<string, unknown>[]): IngestResult {
  const errors: RowIssue[] = [];
  const features: NetworkFeature[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 1; // 1-based, header row excluded
    const normalized = normalizeRow(raw);
    const parsed = networkRowSchema.safeParse(normalized);

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      errors.push({ row: rowNumber, message: message || "Invalid row." });
      return;
    }

    const row = parsed.data;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [row.longitude, row.latitude] },
      properties: {
        location_name: row.location_name ?? `Reading ${rowNumber}`,
        signal_strength: row.signal_strength,
        connection_type: row.connection_type,
        mobile_number: row.mobile_number,
        // Default to "now" when the source row omitted a timestamp, so
        // every feature downstream can assume a real, parseable date is
        // always present rather than checking for undefined everywhere.
        timestamp: row.timestamp ?? new Date().toISOString(),
        sim_slot: row.sim_slot,
        network_score: 0, // filled in by scoreFeatures below
      },
    });
  });

  const collection: NetworkFeatureCollection = { type: "FeatureCollection", features };
  return { collection: scoreFeatures(collection), errors };
}
