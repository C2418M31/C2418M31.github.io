import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { AdminLevel } from "@/lib/geo/types";

/**
 * PSGC administrative boundaries, sourced at runtime from
 * faeldon/philippines-json-maps (MIT licensed; verified 2026-08-05) via the
 * jsDelivr GitHub CDN. This is a deliberate interim choice: it avoids
 * bundling a ~42,000-polygon barangay dataset into this app, but it does
 * mean boundary rendering depends on a third-party CDN staying up and the
 * upstream repo keeping these exact file paths. If that becomes a problem,
 * mirror the specific resolution files this module needs into this app's
 * own static hosting/object storage without changing the function
 * signatures below.
 *
 * The upstream data is chunked by parent already (one file per province's
 * cities, one file per city's barangays), which is what makes on-demand
 * loading by level practical instead of shipping the whole country at once:
 *   - province level: 17 small per-region files, merged once and cached.
 *   - city level: one file per province, fetched when that province is opened.
 *   - barangay level: one file per city/municipality, fetched when opened.
 */

const CDN_BASE = "https://cdn.jsdelivr.net/gh/faeldon/philippines-json-maps@master/2023/geojson";

export interface AdminBoundaryProperties {
  psgcCode: number;
  name: string;
  parentPsgcCode?: number;
  level: AdminLevel;
}

export type AdminBoundaryFeature = Feature<Polygon | MultiPolygon, AdminBoundaryProperties>;
export type AdminBoundaryCollection = FeatureCollection<Polygon | MultiPolygon, AdminBoundaryProperties>;

// PSGC field names differ per level in the source data (adm2_psgc/adm2_en
// for provinces, adm3_psgc/adm3_en for cities, adm4_psgc/adm4_en for
// barangays). Normalizing on fetch means nothing downstream needs to know
// which level's raw key names it's looking at.
const LEVEL_FIELD_PREFIX: Record<AdminLevel, string> = {
  province: "adm2",
  city: "adm3",
  barangay: "adm4",
};
const PARENT_FIELD_PREFIX: Record<AdminLevel, string> = {
  province: "adm1",
  city: "adm2",
  barangay: "adm3",
};

interface RawBoundaryFeature {
  type: "Feature";
  geometry: Polygon | MultiPolygon;
  properties: Record<string, unknown>;
}
interface RawBoundaryCollection {
  type: "FeatureCollection";
  features: RawBoundaryFeature[];
}

function normalize(raw: RawBoundaryCollection, level: AdminLevel): AdminBoundaryCollection {
  const idKey = `${LEVEL_FIELD_PREFIX[level]}_psgc`;
  const nameKey = `${LEVEL_FIELD_PREFIX[level]}_en`;
  const parentKey = `${PARENT_FIELD_PREFIX[level]}_psgc`;

  return {
    type: "FeatureCollection",
    features: raw.features.map((f) => ({
      type: "Feature",
      geometry: f.geometry,
      properties: {
        psgcCode: Number(f.properties[idKey]),
        name: String(f.properties[nameKey] ?? "Unknown"),
        parentPsgcCode:
          f.properties[parentKey] != null ? Number(f.properties[parentKey]) : undefined,
        level,
      },
    })),
  };
}

// In-memory cache keyed by URL: within a session, the same boundary chunk
// is never fetched twice. This is a plain module-level Map, so it resets
// on full page reload — fine for boundary data, which changes at most
// once a year (PSGC updates).
const cache = new Map<string, Promise<AdminBoundaryCollection>>();

async function fetchBoundaryFile(url: string, level: AdminLevel): Promise<AdminBoundaryCollection> {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load boundary data (${res.status}): ${url}`);
        return res.json() as Promise<RawBoundaryCollection>;
      })
      .then((raw) => normalize(raw, level));
    cache.set(url, pending);
  }
  return pending;
}

/** Province boundaries within one region, e.g. adm1Psgc=100000000 for Region I. */
export function fetchProvincesForRegion(adm1Psgc: number): Promise<AdminBoundaryCollection> {
  return fetchBoundaryFile(
    `${CDN_BASE}/regions/lowres/provdists-region-${adm1Psgc}.0.001.json`,
    "province",
  );
}

/** City/municipality boundaries within one province. */
export function fetchCitiesForProvince(adm2Psgc: number): Promise<AdminBoundaryCollection> {
  return fetchBoundaryFile(
    `${CDN_BASE}/provdists/medres/municities-provdist-${adm2Psgc}.0.01.json`,
    "city",
  );
}

/** Barangay boundaries within one city/municipality. */
export function fetchBarangaysForCity(adm3Psgc: number): Promise<AdminBoundaryCollection> {
  return fetchBoundaryFile(
    `${CDN_BASE}/municities/medres/bgysubmuns-municity-${adm3Psgc}.0.01.json`,
    "barangay",
  );
}

let regionCodesPromise: Promise<number[]> | null = null;

/** The 17 top-level region PSGC codes, used only to enumerate provinces nationwide. */
function fetchRegionCodes(): Promise<number[]> {
  if (!regionCodesPromise) {
    regionCodesPromise = fetch(`${CDN_BASE}/country/lowres/country.0.001.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load region list.");
        return res.json() as Promise<RawBoundaryCollection>;
      })
      .then((raw) => raw.features.map((f) => Number(f.properties.adm1_psgc)));
  }
  return regionCodesPromise;
}

/**
 * All provinces nationwide (~80 features), for the default province-level
 * choropleth. Fetches all 17 per-region files in parallel and merges them;
 * cheap after the first call since each chunk is cached individually.
 */
export async function fetchAllProvinces(): Promise<AdminBoundaryCollection> {
  const regionCodes = await fetchRegionCodes();
  const chunks = await Promise.all(regionCodes.map((code) => fetchProvincesForRegion(code)));
  return { type: "FeatureCollection", features: chunks.flatMap((c) => c.features) };
}
