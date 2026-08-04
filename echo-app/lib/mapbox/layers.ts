import type mapboxgl from "mapbox-gl";
import { buildChoroplethGrid } from "@/lib/geo/choropleth";
import type { NetworkFeatureCollection, ViewMode } from "@/lib/geo/types";

const LAYER_IDS = {
  choroplethFill: "choropleth-fill",
  choroplethOutline: "choropleth-outline",
  heat: "data-heat",
  circles: "data-circles",
} as const;

export const CLICKABLE_LAYER_ID = LAYER_IDS.circles;

/** Adds all sources/layers once. Safe to call multiple times; no-ops if already set up. */
export function setupDataLayers(map: mapboxgl.Map, data: NetworkFeatureCollection) {
  if (map.getSource("data-points")) return;

  map.addSource("data-points", { type: "geojson", data });
  map.addSource("choropleth-data", { type: "geojson", data: buildChoroplethGrid(data) });

  const layers = map.getStyle()?.layers ?? [];
  const firstSymbolId = layers.find((l) => l.type === "symbol")?.id;

  map.addLayer(
    {
      id: LAYER_IDS.choroplethFill,
      type: "fill",
      source: "choropleth-data",
      layout: { visibility: "none" },
      paint: {
        "fill-color": [
          "step",
          ["get", "avg_score"],
          "#F44336",
          0.3,
          "#FF9800",
          0.6,
          "#4CAF50",
        ],
        "fill-opacity": 0.55,
      },
    },
    firstSymbolId,
  );

  map.addLayer(
    {
      id: LAYER_IDS.choroplethOutline,
      type: "line",
      source: "choropleth-data",
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
      maxzoom: 15,
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
        "circle-color": [
          "step",
          ["get", "network_score"],
          "#F44336",
          0.3,
          "#FF9800",
          0.6,
          "#4CAF50",
        ],
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

export function applyViewMode(map: mapboxgl.Map, mode: ViewMode) {
  if (!map.getLayer(LAYER_IDS.circles)) return;

  const visibility: Record<string, "visible" | "none"> = {
    [LAYER_IDS.circles]: "none",
    [LAYER_IDS.heat]: "none",
    [LAYER_IDS.choroplethFill]: "none",
    [LAYER_IDS.choroplethOutline]: "none",
  };

  if (mode === "points") visibility[LAYER_IDS.circles] = "visible";
  if (mode === "heatmap") visibility[LAYER_IDS.heat] = "visible";
  if (mode === "choropleth") {
    visibility[LAYER_IDS.choroplethFill] = "visible";
    visibility[LAYER_IDS.choroplethOutline] = "visible";
  }

  Object.entries(visibility).forEach(([id, v]) => map.setLayoutProperty(id, "visibility", v));
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
    map.setFilter(LAYER_IDS.heat, null);
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
  map.setFilter(LAYER_IDS.heat, finalExpr);
}
