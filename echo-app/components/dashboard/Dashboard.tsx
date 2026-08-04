"use client";

import { useCallback, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";
import MapView, { type MapViewHandle } from "@/components/map/MapView";
import Sidebar from "@/components/sidebar/Sidebar";
import { useNetworkData } from "@/hooks/useNetworkData";
import { computeAreaStats } from "@/lib/geo/area";
import { INITIAL_VIEW_STATE, MAPBOX_TOKEN } from "@/lib/mapbox/config";
import type { NetworkProperties, Selection, ViewMode } from "@/lib/geo/types";
import type { AnalyzeResult, ChatAction, QueryFilter } from "@/lib/ai/types";

export default function Dashboard() {
  const { data, error: dataError } = useNetworkData();
  const mapRef = useRef<MapViewHandle>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("points");
  const [filter, setFilter] = useState<QueryFilter | null>(null);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (nextSelection: Selection) => {
    setSelection(nextSelection);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSelection),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analysis failed.");
      setAnalysisResult(json as AnalyzeResult);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const handleFeatureClick = useCallback(
    (properties: NetworkProperties, coords: mapboxgl.LngLat) => {
      runAnalysis({
        kind: "user",
        coordinates: [coords.lng, coords.lat],
        properties,
      });
    },
    [runAnalysis],
  );

  const handleAreaClick = useCallback(
    async (coords: mapboxgl.LngLat) => {
      if (!data) return;
      const stats = computeAreaStats(data, [coords.lng, coords.lat]);
      let locationName = `Area near ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;

      try {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${MAPBOX_TOKEN}`,
        );
        const geoData = await geoRes.json();
        if (geoData.features?.[0]) locationName = geoData.features[0].place_name;
      } catch {
        // Reverse geocoding is best-effort; fall back to the coordinate label.
      }

      runAnalysis({
        kind: "area",
        coordinates: [coords.lng, coords.lat],
        locationName,
        ...stats,
      });
    },
    [data, runAnalysis],
  );

  const handleChatAction = useCallback((action: ChatAction) => {
    if (action.type === "flyTo") {
      mapRef.current?.flyTo({
        center: action.center,
        zoom: action.zoom ?? 10,
        pitch: action.pitch ?? 0,
        bearing: action.bearing ?? 0,
      });
    } else if (action.type === "resetView") {
      mapRef.current?.resetView();
    }
  }, []);

  return (
    <div className="flex">
      <main className="relative h-screen w-2/3 flex-grow">
        {dataError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900 text-red-400">
            {dataError}
          </div>
        )}
        <MapView
          ref={mapRef}
          data={data}
          viewMode={viewMode}
          filter={filter}
          onFeatureClick={handleFeatureClick}
          onAreaClick={handleAreaClick}
        />
      </main>
      <Sidebar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetView={() => mapRef.current?.resetView()}
        selection={selection}
        analysisLoading={analysisLoading}
        analysisResult={analysisResult}
        analysisError={analysisError}
        chatContext={{
          mapCenter: INITIAL_VIEW_STATE.center,
          currentZoom: INITIAL_VIEW_STATE.zoom,
          featureSummary: data
            ? `${data.features.length} subscriber points across the Philippines; connection types 5G/4G/3G/None.`
            : "Dataset still loading.",
        }}
        onChatAction={handleChatAction}
        onFilter={setFilter}
      />
    </div>
  );
}
