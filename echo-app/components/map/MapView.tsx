"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { INITIAL_VIEW_STATE, MAPBOX_TOKEN } from "@/lib/mapbox/config";
import {
  applyScoreFilter,
  applyViewMode,
  CLICKABLE_LAYER_ID,
  setupDataLayers,
  type ScoreFilter,
} from "@/lib/mapbox/layers";
import type { NetworkFeatureCollection, NetworkProperties, ViewMode } from "@/lib/geo/types";
import MapLegend from "./MapLegend";

export interface MapViewHandle {
  flyTo: (options: mapboxgl.EasingOptions) => void;
  resetView: () => void;
}

interface MapViewProps {
  data: NetworkFeatureCollection | null;
  viewMode: ViewMode;
  filter: ScoreFilter | null;
  onFeatureClick: (properties: NetworkProperties, coords: mapboxgl.LngLat) => void;
  onAreaClick: (coords: mapboxgl.LngLat) => void;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { data, viewMode, filter, onFeatureClick, onAreaClick },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Keeps click handlers fresh without re-registering the map click listener.
  const handlersRef = useRef({ onFeatureClick, onAreaClick });
  handlersRef.current = { onFeatureClick, onAreaClick };

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
      const features = map.queryRenderedFeatures(e.point, { layers: [CLICKABLE_LAYER_ID] });
      map.flyTo({ center: e.lngLat, zoom: 16, pitch: 60, bearing: -45 });
      if (features.length > 0) {
        handlersRef.current.onFeatureClick(
          features[0].properties as NetworkProperties,
          e.lngLat,
        );
      } else {
        handlersRef.current.onAreaClick(e.lngLat);
      }
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

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapLegend />
    </div>
  );
});

export default MapView;
