// @turf/turf has no usable types under this project's module resolution
// (see types/turf.d.ts); its calls are treated as `any` and we cast back
// to our own GeoJSON types at the boundary, matching lib/geo/choropleth.ts.
import * as turf from "@turf/turf";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { AdminBoundaryCollection } from "@/lib/data/adminBoundaries";
import type { NetworkFeatureCollection } from "./types";

export interface AdminCellStats {
  psgcCode: number;
  name: string;
  /** Number of crowdsource readings that fell inside this boundary. */
  pointCount: number;
  /** Average normalized network_score (0-1), or null if pointCount is 0. */
  avgScore: number | null;
  connectionMix: Record<string, number>;
}

/**
 * Spatial join: buckets each crowdsource point into whichever boundary
 * polygon contains it, then aggregates score/connection-type stats per
 * boundary. Returns one entry per boundary feature, including ones with
 * zero points (pointCount 0, avgScore null) — callers should treat those
 * as "no data" rather than "no signal," per the confidence concern raised
 * earlier: a cell with 1 report and a cell with 500 reports should not
 * look the same on the map.
 *
 * This does a point-in-polygon check against every polygon in the given
 * boundary set for every point (O(points * polygons)). That's fine at the
 * chunk sizes lib/data/adminBoundaries.ts hands back (tens of provinces,
 * low hundreds of cities/barangays per parent) — if this is ever called
 * with a much larger boundary set in one pass, swap in a spatial index
 * (e.g. a grid or turf's tag-based approach) instead of this linear scan.
 */
export function aggregatePointsToBoundaries(
  points: NetworkFeatureCollection,
  boundaries: AdminBoundaryCollection,
): AdminCellStats[] {
  const stats = new Map<number, AdminCellStats>();
  boundaries.features.forEach((b) => {
    stats.set(b.properties.psgcCode, {
      psgcCode: b.properties.psgcCode,
      name: b.properties.name,
      pointCount: 0,
      avgScore: null,
      connectionMix: {},
    });
  });

  const scoreSums = new Map<number, number>();

  points.features.forEach((point) => {
    const match = boundaries.features.find((b) => turf.booleanPointInPolygon(point, b));
    if (!match) return; // point falls outside every boundary in this chunk

    const cell = stats.get(match.properties.psgcCode);
    if (!cell) return;

    cell.pointCount += 1;
    scoreSums.set(
      match.properties.psgcCode,
      (scoreSums.get(match.properties.psgcCode) ?? 0) + point.properties.network_score,
    );
    const type = point.properties.connection_type;
    cell.connectionMix[type] = (cell.connectionMix[type] ?? 0) + 1;
  });

  stats.forEach((cell) => {
    if (cell.pointCount > 0) {
      cell.avgScore = (scoreSums.get(cell.psgcCode) ?? 0) / cell.pointCount;
    }
  });

  return Array.from(stats.values());
}

export interface AdminChoroplethProperties {
  psgc_code: number;
  name: string;
  point_count: number;
  avg_score: number | null;
}

export type AdminChoroplethCollection = FeatureCollection<
  Polygon | MultiPolygon,
  AdminChoroplethProperties
>;

/**
 * Merges boundary geometry with the stats computed above into one
 * FeatureCollection mapbox can render directly as a fill layer.
 */
export function buildAdminChoroplethFeatureCollection(
  boundaries: AdminBoundaryCollection,
  stats: AdminCellStats[],
): AdminChoroplethCollection {
  const statsByCode = new Map(stats.map((s) => [s.psgcCode, s]));

  return {
    type: "FeatureCollection",
    features: boundaries.features.map((b) => {
      const cell = statsByCode.get(b.properties.psgcCode);
      return {
        type: "Feature",
        geometry: b.geometry,
        properties: {
          psgc_code: b.properties.psgcCode,
          name: b.properties.name,
          point_count: cell?.pointCount ?? 0,
          avg_score: cell?.avgScore ?? null,
        },
      };
    }),
  };
}
