import type mapboxgl from "mapbox-gl";
import type { FeatureCollection } from "geojson";
import { buildChoroplethGrid } from "@/lib/geo/choropleth";
import type { AdminChoroplethCollection } from "@/lib/geo/adminAggregate";
import type { NetworkFeatureCollection, ViewMode } from "@/lib/geo/types";

const LAYER_IDS = {
  choroplethGridFill: "choropleth-grid-fill",
  choroplethGridOutline: "choropleth-grid-outline",
  adminFill: "choropleth-admin-fill",
  adminOutline: "choropleth-admin-outline",
  heat: "data-heat",
  circles: "data-circles",
  hazardCircles: "hazard-earthquake-circles",
} as const;

export const CLICKABLE_LAYER_ID = LAYER_IDS.circles;
export const ADMIN_CLICKABLE_LAYER_ID = LAYER_IDS.adminFill;
export const HAZARD_CLICKABLE_LAYER_ID = LAYER_IDS.hazardCircles;

const EMPTY_FEATURE_COLLECTION: FeatureCollection = { type: "FeatureCollection", features: [] };

/**
 * Continuous score ramp shared by every layer that colors by network_score
 * (circles, grid choropleth, admin choropleth) so the legend means the same
 * thing regardless of which view mode is active. Replaces the old 3-step
 * red/orange/green scale, which didn't distinguish "barely slow" from
 * "completely dead."
 *
 * Deliberately red -> orange -> yellow -> teal -> blue rather than the more
 * conventional red -> yellow -> green: red-green is the single worst hue
 * pair for the most common form of colorblindness (deuteranopia/protanopia,
 * ~8% of men), and this app's whole premise is a map where "which areas are
 * bad" needs to be legible to everyone looking at it, not just ops staff
 * with typical color vision. Bad still reads as red, good still reads as a
 * cool, calm color — just not green. A full accessibility pass (contrast
 * ratios, focus states, screen reader labels) is still recommended as a
 * follow-up; this only addresses the color-hue part of it.
 *
 * Typed as `any` deliberately: mapbox-gl's expression types are a strict
 * recursive tuple shape that a separately-declared constant like this
 * won't structurally satisfy without fighting the compiler, and this
 * project already casts to `unknown`/`any` at the mapbox boundary
 * elsewhere (see ScoreFilter below) rather than fight it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SCORE_COLOR_RAMP: any = [
  "interpolate",
  ["linear"],
  ["coalesce", ["get", "network_score"], ["get", "avg_score"], 0],
  0,
  "#B71C1C",
  0.3,
  "#E53935",
  0.5,
  "#FB8C00",
  0.7,
  "#FDD835",
  0.85,
  "#26A69A",
  1,
  "#1565C0",
];

/** Adds all sources/layers once. Safe to call multiple times; no-ops if already set up. */
export function setupDataLayers(map: mapboxgl.Map, data: NetworkFeatureCollection) {
  if (map.getSource("data-points")) return;

  map.addSource("data-points", { type: "geojson", data });
  map.addSource("choropleth-grid-data", { type: "geojson", data: buildChoroplethGrid(data) });
  map.addSource("choropleth-admin-data", { type: "geojson", data: EMPTY_FEATURE_COLLECTION });

  const layers = map.getStyle()?.layers ?? [];
  const firstSymbolId = layers.find((l) => l.type === "symbol")?.id;

  map.addLayer(
    {
      id: LAYER_IDS.choroplethGridFill,
      type: "fill",
      source: "choropleth-grid-data",
      layout: { visibility: "none" },
      paint: {
        "fill-color": SCORE_COLOR_RAMP,
        "fill-opacity": 0.55,
      },
    },
    firstSymbolId,
  );

  map.addLayer(
    {
      id: LAYER_IDS.choroplethGridOutline,
      type: "line",
      source: "choropleth-grid-data",
      layout: { visibility: "none" },
      paint: { "line-color": "#1f2937", "line-width": 1 },
    },
    firstSymbolId,
  );

  map.addLayer(
    {
      id: LAYER_IDS.adminFill,
      type: "fill",
      source: "choropleth-admin-data",
      layout: { visibility: "none" },
      paint: {
        // Boundaries with zero reports render as a flat neutral gray rather
        // than the bottom of the score ramp — a cell nobody has reported
        // from yet is "no data," not "confirmed dead," and coloring it red
        // would be misleading.
        "fill-color": [
          "case",
          ["==", ["get", "point_count"], 0],
          "rgba(55, 65, 81, 0.2)",
          SCORE_COLOR_RAMP,
        ],
        "fill-opacity": 0.65,
      },
    },
    firstSymbolId,
  );

  map.addLayer(
    {
      id: LAYER_IDS.adminOutline,
      type: "line",
      source: "choropleth-admin-data",
      layout: { visibility: "none" },
      paint: { "line-color": "#1f2937", "line-width": 1 },
    },
    firstSymbolId,
  );

  map.addLayer(
    {
      id: LAYER_IDS.heat,
      type: "heatmap",
      source: "data-points",
      // No maxzoom cap: this used to cut off at zoom 15, which meant the
      // heatmap vanished entirely the moment any click's flyTo (zoom 16)
      // landed — reading as "the heatmap is broken" rather than "you've
      // zoomed past where it renders." heatmap-intensity/-radius below
      // still clamp to their zoom-15 values past that point since their
      // interpolation stops end there, so it doesn't get more expensive
      // to render at deep zoom, it just stops changing.
      layout: { visibility: "none" },
      paint: {
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "network_score"],
          0,
          1,
          0.3,
          0.6,
          1,
          0.1,
        ],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 5, 1, 15, 3],
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(0,0,0,0)",
          0.3,
          "#4CAF50",
          0.6,
          "#FF9800",
          1,
          "#F44336",
        ],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 5, 15, 15, 35],
        "heatmap-opacity": 0.8,
      },
    },
    firstSymbolId,
  );

  map.addLayer(
    {
      id: LAYER_IDS.circles,
      type: "circle",
      source: "data-points",
      paint: {
        "circle-color": SCORE_COLOR_RAMP,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 2, 16, 10],
        "circle-stroke-width": 1,
        "circle-stroke-color": "#1f2937",
        "circle-opacity": 0.85,
      },
    },
    firstSymbolId,
  );

  map.addLayer(
    {
      id: "3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 15,
      paint: {
        "fill-extrusion-color": "#ccc",
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "min_height"],
        ],
        "fill-extrusion-opacity": 0.6,
      },
    },
    firstSymbolId,
  );
}

/** Pushes freshly-fetched/aggregated admin boundary data into its source. No-ops before setup. */
export function setAdminBoundaryData(map: mapboxgl.Map, data: AdminChoroplethCollection) {
  const source = map.getSource("choropleth-admin-data") as mapboxgl.GeoJSONSource | undefined;
  source?.setData(data as unknown as FeatureCollection);
}

export function applyViewMode(map: mapboxgl.Map, mode: ViewMode) {
  if (!map.getLayer(LAYER_IDS.circles)) return;

  const visibility: Record<string, "visible" | "none"> = {
    [LAYER_IDS.circles]: "none",
    [LAYER_IDS.heat]: "none",
    [LAYER_IDS.choroplethGridFill]: "none",
    [LAYER_IDS.choroplethGridOutline]: "none",
    [LAYER_IDS.adminFill]: "none",
    [LAYER_IDS.adminOutline]: "none",
  };

  if (mode === "points") visibility[LAYER_IDS.circles] = "visible";
  if (mode === "heatmap") visibility[LAYER_IDS.heat] = "visible";
  if (mode === "choropleth-grid") {
    visibility[LAYER_IDS.choroplethGridFill] = "visible";
    visibility[LAYER_IDS.choroplethGridOutline] = "visible";
  }
  if (mode === "choropleth-admin") {
    visibility[LAYER_IDS.adminFill] = "visible";
    visibility[LAYER_IDS.adminOutline] = "visible";
  }

  // Only touch layers that actually made it into the style. Without this
  // guard, one layer failing to add during setupDataLayers (as happened
  // with the invalid #RRGGBBAA color bug) permanently breaks every other
  // view mode too, since setLayoutProperty throws on a missing layer id
  // and setupDataLayers never retries layers it already got past.
  Object.entries(visibility).forEach(([id, v]) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", v);
  });
}

export interface ScoreFilter {
  connectionTypes?: string[];
  minScore?: number;
  maxScore?: number;
}

export function applyScoreFilter(map: mapboxgl.Map, filter: ScoreFilter | null) {
  if (!map.getLayer(LAYER_IDS.circles)) return;

  if (!filter) {
    map.setFilter(LAYER_IDS.circles, null);
    if (map.getLayer(LAYER_IDS.heat)) map.setFilter(LAYER_IDS.heat, null);
    return;
  }

  const expr: unknown[] = ["all"];
  if (filter.minScore != null) expr.push([">=", ["get", "network_score"], filter.minScore]);
  if (filter.maxScore != null) expr.push(["<=", ["get", "network_score"], filter.maxScore]);
  if (filter.connectionTypes?.length) {
    expr.push(["in", ["get", "connection_type"], ["literal", filter.connectionTypes]]);
  }

  const finalExpr = expr.length > 1 ? (expr as mapboxgl.FilterSpecification) : null;
  map.setFilter(LAYER_IDS.circles, finalExpr);
  if (map.getLayer(LAYER_IDS.heat)) map.setFilter(LAYER_IDS.heat, finalExpr);
}

const HAZARD_SOURCE_ID = "hazard-earthquake-data";

/**
 * Earthquake epicenter markers (see lib/hazards/*). A separate, independent
 * overlay rather than a ViewMode — it's meant to be toggled on top of
 * whichever data view is already active (points/heatmap/grid/boundaries),
 * not to replace any of them. Off by default; safe to call before hazard
 * data exists (starts from an empty source, same pattern as the admin
 * choropleth source in setupDataLayers).
 */
export function setupHazardLayer(map: mapboxgl.Map) {
  if (map.getSource(HAZARD_SOURCE_ID)) return;

  map.addSource(HAZARD_SOURCE_ID, { type: "geojson", data: EMPTY_FEATURE_COLLECTION });

  map.addLayer({
    id: LAYER_IDS.hazardCircles,
    type: "circle",
    source: HAZARD_SOURCE_ID,
    layout: { visibility: "none" },
    paint: {
      // Bigger and redder with magnitude, distinct from the network score
      // ramp on purpose — a hazard signal shouldn't visually blend in with
      // "this area has bad signal."
      "circle-radius": ["interpolate", ["linear"], ["get", "magnitude"], 4, 8, 5.5, 14, 7, 24],
      "circle-color": [
        "interpolate",
        ["linear"],
        ["get", "magnitude"],
        4,
        "#FBBF24",
        5.5,
        "#FB923C",
        7,
        "#EF4444",
      ],
      "circle-opacity": 0.3,
      "circle-stroke-width": 2,
      "circle-stroke-color": [
        "interpolate",
        ["linear"],
        ["get", "magnitude"],
        4,
        "#FBBF24",
        5.5,
        "#FB923C",
        7,
        "#EF4444",
      ],
      "circle-stroke-opacity": 0.9,
    },
  });
}

/** Pushes freshly-fetched earthquake data into the hazard source. No-ops before setup. */
export function setHazardData(map: mapboxgl.Map, data: FeatureCollection) {
  const source = map.getSource(HAZARD_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  source?.setData(data);
}

export function setHazardVisibility(map: mapboxgl.Map, visible: boolean) {
  if (map.getLayer(LAYER_IDS.hazardCircles)) {
    map.setLayoutProperty(LAYER_IDS.hazardCircles, "visibility", visible ? "visible" : "none");
  }
}
