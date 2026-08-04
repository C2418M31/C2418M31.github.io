import type { NetworkFeatureCollection } from "./types";

const MIN_DBM = -110;
const MAX_DBM = -70;
const NO_CONNECTION_THRESHOLD_DBM = -106;

export type NetworkQuality = "Good" | "Slow" | "No Connection";

/**
 * Mutates and returns the feature collection with a normalized 0-1
 * network_score derived from signal strength and connection type.
 */
export function scoreFeatures(fc: NetworkFeatureCollection): NetworkFeatureCollection {
  fc.features.forEach((f) => {
    const signal = f.properties.signal_strength;
    const type = (f.properties.connection_type || "").toUpperCase();

    let score: number;
    if (type === "NONE" || signal <= NO_CONNECTION_THRESHOLD_DBM) {
      score = 0;
    } else {
      score = (signal - MIN_DBM) / (MAX_DBM - MIN_DBM);
      score = Math.max(0, Math.min(1, score));
    }
    f.properties.network_score = score;
  });
  return fc;
}

export function qualityFromScore(score: number): NetworkQuality {
  if (score >= 0.6) return "Good";
  if (score >= 0.3) return "Slow";
  return "No Connection";
}
