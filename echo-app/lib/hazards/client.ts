import type { FeatureCollection, Point } from "geojson";
import type { EarthquakeAlert } from "./types";

/** Fetches the normalized alert list from our own proxy route (see app/api/hazards/earthquakes). */
export async function fetchEarthquakeAlerts(): Promise<EarthquakeAlert[]> {
  const res = await fetch("/api/hazards/earthquakes");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load earthquake data.");
  return json.earthquakes as EarthquakeAlert[];
}

export interface EarthquakeProperties {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  depthKm: number;
  nearbyPointCount: number;
}

export type EarthquakeFeatureCollection = FeatureCollection<Point, EarthquakeProperties>;

/** Converts the alert list into a GeoJSON collection the map's hazard layer can render directly. */
export function toEarthquakeFeatureCollection(alerts: EarthquakeAlert[]): EarthquakeFeatureCollection {
  return {
    type: "FeatureCollection",
    features: alerts.map((a) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: a.coordinates },
      properties: {
        id: a.id,
        magnitude: a.magnitude,
        place: a.place,
        time: a.time,
        depthKm: a.depthKm,
        nearbyPointCount: a.nearbyPointCount,
      },
    })),
  };
}
