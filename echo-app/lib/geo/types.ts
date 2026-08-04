import type { Feature, FeatureCollection, Point } from "geojson";

export interface NetworkProperties {
  mobile_number?: string;
  location_name: string;
  signal_strength: number;
  connection_type: string;
  network_score: number;
  [key: string]: unknown;
}

export type NetworkFeature = Feature<Point, NetworkProperties>;
export type NetworkFeatureCollection = FeatureCollection<Point, NetworkProperties>;

export type ViewMode = "points" | "heatmap" | "choropleth";

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

export type Selection = UserSelection | AreaSelection;
