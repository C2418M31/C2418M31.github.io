// @turf/turf has no usable types under this project's module resolution
// (see types/turf.d.ts); its calls are treated as `any` and we cast back
// to our own GeoJSON types at the boundary.
import * as turf from "@turf/turf";
import type { NetworkFeatureCollection } from "./types";

export interface AreaStats {
  userCount: number;
  avgScore: number;
  connectionMix: Record<string, number>;
}

export function computeAreaStats(
  data: NetworkFeatureCollection,
  center: [number, number],
  radiusKm = 10,
): AreaStats {
  const point = turf.point(center);
  const circle = turf.circle(point, radiusKm, { units: "kilometers" });
  const within: NetworkFeatureCollection = turf.pointsWithinPolygon(data, circle);

  const userCount = within.features.length;
  const total = within.features.reduce(
    (sum, f) => sum + (f.properties?.network_score ?? 0),
    0,
  );
  const avgScore = userCount > 0 ? total / userCount : 0;

  const connectionMix: Record<string, number> = {};
  within.features.forEach((f) => {
    const type = f.properties?.connection_type ?? "Unknown";
    connectionMix[type] = (connectionMix[type] ?? 0) + 1;
  });

  return { userCount, avgScore, connectionMix };
}
