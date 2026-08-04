// @turf/turf has no usable types under this project's module resolution
// (see types/turf.d.ts); its calls are treated as `any` and we cast back
// to our own GeoJSON types at the boundary.
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { NetworkFeatureCollection } from "./types";

export interface ChoroplethCellProperties {
  point_count: number;
  avg_score: number | null;
}

export function buildChoroplethGrid(
  fc: NetworkFeatureCollection,
  cellSizeKm = 25,
): FeatureCollection<Polygon, ChoroplethCellProperties> {
  const bbox = turf.bbox(fc) as [number, number, number, number];
  const grid: FeatureCollection<Polygon> = turf.hexGrid(bbox, cellSizeKm, {
    units: "kilometers",
  });

  const cells = grid.features
    .map((cell): Feature<Polygon, ChoroplethCellProperties> => {
      const pointsWithin: NetworkFeatureCollection = turf.pointsWithinPolygon(fc, cell);
      const count = pointsWithin.features.length;
      const avgScore =
        count > 0
          ? pointsWithin.features.reduce(
              (sum, f) => sum + (f.properties?.network_score ?? 0),
              0,
            ) / count
          : null;

      return {
        ...cell,
        properties: { point_count: count, avg_score: avgScore },
      };
    })
    .filter((cell) => cell.properties.point_count > 0);

  return { type: "FeatureCollection", features: cells };
}
