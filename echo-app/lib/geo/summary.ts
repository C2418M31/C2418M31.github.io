import type { NetworkFeatureCollection } from "./types";

export interface NetworkSummary {
  totalReports: number;
  avgScore: number;
  connectionTypeCounts: Record<string, number>;
  /** Reports scoring below the "Slow" threshold (see lib/geo/scoring.ts). */
  poorCoverageCount: number;
  poorCoveragePct: number;
  /** Most recent reading timestamp, if any reports carry one. */
  latestTimestamp: string | null;
}

const POOR_COVERAGE_THRESHOLD = 0.3;

/** Nationwide (or currently-loaded-dataset) KPI rollup, used by the header/KPI bar. */
export function summarizeNetwork(data: NetworkFeatureCollection): NetworkSummary {
  const features = data.features;
  const totalReports = features.length;

  if (totalReports === 0) {
    return {
      totalReports: 0,
      avgScore: 0,
      connectionTypeCounts: {},
      poorCoverageCount: 0,
      poorCoveragePct: 0,
      latestTimestamp: null,
    };
  }

  let scoreSum = 0;
  let poorCoverageCount = 0;
  const connectionTypeCounts: Record<string, number> = {};
  let latestTimestamp: string | null = null;

  features.forEach((f) => {
    const p = f.properties;
    scoreSum += p.network_score;
    if (p.network_score < POOR_COVERAGE_THRESHOLD) poorCoverageCount += 1;
    connectionTypeCounts[p.connection_type] = (connectionTypeCounts[p.connection_type] ?? 0) + 1;
    // ISO 8601 timestamps sort correctly as plain strings; avoids a Date
    // parse per feature just to find the max.
    if (p.timestamp && (!latestTimestamp || p.timestamp > latestTimestamp)) {
      latestTimestamp = p.timestamp;
    }
  });

  return {
    totalReports,
    avgScore: scoreSum / totalReports,
    connectionTypeCounts,
    poorCoverageCount,
    poorCoveragePct: (poorCoverageCount / totalReports) * 100,
    latestTimestamp,
  };
}
