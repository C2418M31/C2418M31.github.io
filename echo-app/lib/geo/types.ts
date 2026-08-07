import type { Feature, FeatureCollection, Point } from "geojson";

export interface NetworkProperties {
  mobile_number?: string;
  location_name: string;
  signal_strength: number;
  connection_type: string;
  network_score: number;
  /** ISO 8601 timestamp of when this reading was captured. */
  timestamp?: string;
  /**
   * Which physical SIM slot produced this reading (1 or 2), for dual-SIM
   * usage tracking. Optional and unused today — kept here so ingesting
   * dual-SIM data later doesn't require another schema migration.
   */
  sim_slot?: 1 | 2;
  [key: string]: unknown;
}

export type NetworkFeature = Feature<Point, NetworkProperties>;
export type NetworkFeatureCollection = FeatureCollection<Point, NetworkProperties>;

/**
 * "choropleth-grid" is the existing hex-grid aggregation (lib/geo/choropleth.ts).
 * "choropleth-admin" is the true administrative-boundary choropleth
 * (lib/geo/adminAggregate.ts + lib/data/adminBoundaries.ts), toggled
 * independently at province/city/barangay granularity via AdminLevel.
 */
export type ViewMode = "points" | "heatmap" | "choropleth-grid" | "choropleth-admin";

/**
 * Administrative boundary levels we can render a true choropleth at,
 * from PSGC data (see lib/data/adminBoundaries.ts). Deliberately excludes
 * the coarser "region" level, which is only used internally to enumerate
 * province files — not something an operator picks in the UI.
 */
export type AdminLevel = "province" | "city" | "barangay";

/** What's currently drilled into, for the choropleth-admin view. */
export interface AdminFocus {
  provincePsgc?: number;
  cityPsgc?: number;
}

export interface UserSelection {
  kind: "user";
  coordinates: [number, number];
  properties: NetworkProperties;
}

export interface AreaSelection {
  kind: "area";
  coordinates: [number, number];
  locationName: string;
  userCount: number;
  avgScore: number;
  connectionMix: Record<string, number>;
}

/** A clicked administrative boundary cell (province/city/barangay choropleth). */
export interface RegionSelection {
  kind: "region";
  coordinates: [number, number];
  psgcCode: number;
  name: string;
  level: AdminLevel;
  pointCount: number;
  avgScore: number | null;
  connectionMix: Record<string, number>;
}

export type Selection = UserSelection | AreaSelection | RegionSelection;
