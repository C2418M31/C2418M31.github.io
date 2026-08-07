"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { INITIAL_VIEW_STATE, MAPBOX_TOKEN } from "@/lib/mapbox/config";
import {
  ADMIN_CLICKABLE_LAYER_ID,
  applyScoreFilter,
  applyViewMode,
  CLICKABLE_LAYER_ID,
  HAZARD_CLICKABLE_LAYER_ID,
  setAdminBoundaryData,
  setHazardData,
  setHazardVisibility,
  setupDataLayers,
  setupHazardLayer,
  type ScoreFilter,
} from "@/lib/mapbox/layers";
import type {
  AdminChoroplethCollection,
  AdminChoroplethProperties,
} from "@/lib/geo/adminAggregate";
import type { NetworkFeatureCollection, NetworkProperties, ViewMode } from "@/lib/geo/types";
import type { EarthquakeFeatureCollection, EarthquakeProperties } from "@/lib/hazards/client";
import MapLegend from "./MapLegend";

export interface MapViewHandle {
  flyTo: (options: mapboxgl.EasingOptions) => void;
  resetView: () => void;
}

interface MapViewProps {
  data: NetworkFeatureCollection | null;
  viewMode: ViewMode;
  filter: ScoreFilter | null;
  adminBoundaryData: AdminChoroplethCollection | null;
  hazards: EarthquakeFeatureCollection | null;
  showHazards: boolean;
  onFeatureClick: (properties: NetworkProperties, coords: mapboxgl.LngLat) => void;
  onAreaClick: (coords: mapboxgl.LngLat) => void;
  onAdminAreaClick: (properties: AdminChoroplethProperties, coords: mapboxgl.LngLat) => void;
  onHazardClick: (properties: EarthquakeProperties, coords: mapboxgl.LngLat) => void;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    data,
    viewMode,
    filter,
    adminBoundaryData,
    hazards,
    showHazards,
    onFeatureClick,
    onAreaClick,
    onAdminAreaClick,
    onHazardClick,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Keeps click handlers fresh without re-registering the map click listener.
  const handlersRef = useRef({ onFeatureClick, onAreaClick, onAdminAreaClick, onHazardClick });
  handlersRef.current = { onFeatureClick, onAreaClick, onAdminAreaClick, onHazardClick };

  useImperativeHandle(ref, () => ({
    flyTo: (options) => mapRef.current?.flyTo(options),
    resetView: () => mapRef.current?.flyTo(INITIAL_VIEW_STATE),
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      ...INITIAL_VIEW_STATE,
    });
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.on("click", (e) => {
      // Checked before the network-point layer since hazard markers are an
      // overlay that can be visible on top of any view mode — if both a
      // subscriber dot and a quake marker are under the cursor, the hazard
      // is the more time-sensitive thing to surface.
      const hazardFeatures = map.getLayer(HAZARD_CLICKABLE_LAYER_ID)
        ? map.queryRenderedFeatures(e.point, { layers: [HAZARD_CLICKABLE_LAYER_ID] })
        : [];
      if (hazardFeatures.length > 0) {
        map.flyTo({ center: e.lngLat, zoom: 9 });
        handlersRef.current.onHazardClick(
          hazardFeatures[0].properties as EarthquakeProperties,
          e.lngLat,
        );
        return;
      }

      const pointFeatures = map.queryRenderedFeatures(e.point, { layers: [CLICKABLE_LAYER_ID] });
      if (pointFeatures.length > 0) {
        map.flyTo({ center: e.lngLat, zoom: 16, pitch: 60, bearing: -45 });
        handlersRef.current.onFeatureClick(
          pointFeatures[0].properties as NetworkProperties,
          e.lngLat,
        );
        return;
      }

      // Only queried when the admin choropleth layer exists and is visible,
      // so this is a no-op in every other view mode.
      const adminFeatures = map.getLayer(ADMIN_CLICKABLE_LAYER_ID)
        ? map.queryRenderedFeatures(e.point, { layers: [ADMIN_CLICKABLE_LAYER_ID] })
        : [];
      if (adminFeatures.length > 0) {
        // No flyTo here — Dashboard decides the camera move for a drill-down
        // (fitting the next level's bounds), not a street-level 3D zoom.
        handlersRef.current.onAdminAreaClick(
          adminFeatures[0].properties as AdminChoroplethProperties,
          e.lngLat,
        );
        return;
      }

      // Deliberately no fallback here: a single click on empty space used
      // to fly the camera in and fire a full reverse-geocode + AI analysis
      // call every time, which made "just zoom in to look around" trigger
      // an API call on every click. Empty-space analysis now requires a
      // double-click (below) instead. Dots/boundaries above stay
      // single-click since they're small, deliberate targets, not
      // something you hit by accident while navigating.
    });

    // Native double-click-to-zoom would otherwise fight with the custom
    // flyTo below (both trying to animate the camera on the same
    // gesture), so it's turned off in favor of our own dblclick handler.
    map.doubleClickZoom.disable();

    map.on("dblclick", (e) => {
      // Dots/boundaries/hazards already have their own single-click
      // handling above; double-click only does something on genuinely
      // empty space, so re-check the same layers here to avoid firing
      // area analysis on top of, say, a subscriber dot.
      const hitLayers = [HAZARD_CLICKABLE_LAYER_ID, CLICKABLE_LAYER_ID, ADMIN_CLICKABLE_LAYER_ID].filter(
        (id) => map.getLayer(id),
      );
      const hits = hitLayers.length > 0 ? map.queryRenderedFeatures(e.point, { layers: hitLayers }) : [];
      if (hits.length > 0) return;

      map.flyTo({ center: e.lngLat, zoom: 16, pitch: 60, bearing: -45 });
      handlersRef.current.onAreaClick(e.lngLat);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;

    const setup = () => setupDataLayers(map, data);
    if (map.isStyleLoaded()) setup();
    else map.once("load", setup);
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) applyViewMode(map, viewMode);
  }, [viewMode, data]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) applyScoreFilter(map, filter);
  }, [filter, data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !adminBoundaryData) return;

    const push = () => setAdminBoundaryData(map, adminBoundaryData);
    if (map.isStyleLoaded() && map.getSource("choropleth-admin-data")) push();
    else map.once("load", push);
  }, [adminBoundaryData]);

  // Hazard layer setup doesn't depend on any prop — it just needs to exist
  // once the map style is ready, independent of whether earthquake data has
  // arrived yet (setupHazardLayer starts from an empty source).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const setup = () => setupHazardLayer(map);
    if (map.isStyleLoaded()) setup();
    else map.once("load", setup);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hazards) return;

    const push = () => setHazardData(map, hazards);
    if (map.isStyleLoaded() && map.getSource("hazard-earthquake-data")) push();
    else map.once("load", push);
  }, [hazards]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) setHazardVisibility(map, showHazards);
  }, [showHazards]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapLegend />
    </div>
  );
});

export default MapView;
