/**
 * Server-only USGS earthquake feed access. USGS's FDSN event query API is
 * public, free, and requires no API key — deliberately chosen over
 * PAGASA (the actual PH authority) because PAGASA does not publish a
 * stable machine-readable API; its bulletins are web pages meant for
 * people, not a feed meant for code. If PAGASA ever ships a real API,
 * this module is the only place that needs to change.
 *
 * Docs: https://earthquake.usgs.gov/fdsnws/event/1/
 */

const USGS_QUERY_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";

// Generous bounding box around the Philippine archipelago (includes a
// margin into surrounding seas, since offshore quakes near the coast
// still matter to onshore network infrastructure).
const PH_BBOX = {
  minlatitude: 4,
  maxlatitude: 21.5,
  minlongitude: 114,
  maxlongitude: 127,
};

const LOOKBACK_DAYS = 7;
const MIN_MAGNITUDE = 4.0;

export interface RawUsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number; // epoch ms
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [lng, lat, depthKm]
  };
}

interface RawUsgsResponse {
  features: RawUsgsFeature[];
}

/** Raw, unnormalized USGS features for the Philippines over the lookback window. */
export async function fetchRawEarthquakes(): Promise<RawUsgsFeature[]> {
  const starttime = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    format: "geojson",
    starttime,
    minmagnitude: String(MIN_MAGNITUDE),
    minlatitude: String(PH_BBOX.minlatitude),
    maxlatitude: String(PH_BBOX.maxlatitude),
    minlongitude: String(PH_BBOX.minlongitude),
    maxlongitude: String(PH_BBOX.maxlongitude),
    orderby: "time",
  });

  const res = await fetch(`${USGS_QUERY_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`USGS request failed (${res.status})`);

  const json = (await res.json()) as RawUsgsResponse;
  return json.features ?? [];
}
