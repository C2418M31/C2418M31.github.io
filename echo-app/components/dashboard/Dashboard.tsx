"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";
import MapView, { type MapViewHandle } from "@/components/map/MapView";
import Sidebar from "@/components/sidebar/Sidebar";
import LeftPanel from "@/components/sidebar/LeftPanel";
import Header from "./Header";
import KpiBar from "./KpiBar";
import { useNetworkData } from "@/hooks/useNetworkData";
import { useEarthquakeAlerts } from "@/hooks/useEarthquakeAlerts";
import { useUpcomingFestivals } from "@/hooks/useUpcomingFestivals";
import { computeAreaStats } from "@/lib/geo/area";
import {
  aggregatePointsToBoundaries,
  buildAdminChoroplethFeatureCollection,
  type AdminCellStats,
  type AdminChoroplethCollection,
  type AdminChoroplethProperties,
} from "@/lib/geo/adminAggregate";
import {
  fetchAllProvinces,
  fetchBarangaysForCity,
  fetchCitiesForProvince,
} from "@/lib/data/adminBoundaries";
import { INITIAL_VIEW_STATE, MAPBOX_TOKEN } from "@/lib/mapbox/config";
import { toEarthquakeFeatureCollection, type EarthquakeProperties } from "@/lib/hazards/client";
import type { AdminFocus, AdminLevel, NetworkProperties, Selection, ViewMode } from "@/lib/geo/types";
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

  // Admin (true PSGC boundary) choropleth: which level is showing, what's
  // been drilled into so far, the merged boundary+stats data mapbox
  // renders, and loading/error state for that fetch+aggregate step.
  const [adminLevel, setAdminLevel] = useState<AdminLevel>("province");
  const [adminFocus, setAdminFocus] = useState<AdminFocus>({});
  const [adminBoundaryData, setAdminBoundaryData] = useState<AdminChoroplethCollection | null>(
    null,
  );
  // Raw per-cell stats (includes connectionMix, which the rendered mapbox
  // feature properties deliberately don't carry — see buildAdminChoroplethFeatureCollection).
  // Looked up by psgc_code when a barangay is clicked, so the AI region
  // analysis can see the same connection-type breakdown "area" analysis does.
  const [adminStats, setAdminStats] = useState<AdminCellStats[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Earthquake hazard overlay: off by default so it doesn't clutter the
  // map until someone opts in from the Alerts panel.
  const {
    alerts: earthquakeAlerts,
    loading: earthquakeLoading,
    error: earthquakeError,
  } = useEarthquakeAlerts();
  const [showEarthquakesOnMap, setShowEarthquakesOnMap] = useState(false);
  const earthquakeFeatures = useMemo(
    () => toEarthquakeFeatureCollection(earthquakeAlerts),
    [earthquakeAlerts],
  );

  const {
    festivals,
    loading: festivalsLoading,
    error: festivalsError,
  } = useUpcomingFestivals();

  useEffect(() => {
    if (viewMode !== "choropleth-admin" || !data) return;
    let cancelled = false;
    setAdminLoading(true);
    setAdminError(null);

    async function loadBoundaries() {
      if (adminLevel === "province") return fetchAllProvinces();
      if (adminLevel === "city") {
        if (!adminFocus.provincePsgc) throw new Error("Click a province first to see its cities.");
        return fetchCitiesForProvince(adminFocus.provincePsgc);
      }
      if (!adminFocus.cityPsgc) throw new Error("Click a city/municipality first to see its barangays.");
      return fetchBarangaysForCity(adminFocus.cityPsgc);
    }

    loadBoundaries()
      .then((boundaries) => {
        if (cancelled) return;
        const stats = aggregatePointsToBoundaries(data, boundaries);
        setAdminStats(stats);
        setAdminBoundaryData(buildAdminChoroplethFeatureCollection(boundaries, stats));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAdminError(err instanceof Error ? err.message : "Failed to load boundary data.");
        setAdminBoundaryData(null);
      })
      .finally(() => {
        if (!cancelled) setAdminLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewMode, adminLevel, adminFocus, data]);

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

  const handleAdminAreaClick = useCallback(
    (properties: AdminChoroplethProperties, coords: mapboxgl.LngLat) => {
      if (adminLevel === "province") {
        setAdminFocus({ provincePsgc: properties.psgc_code });
        setAdminLevel("city");
        mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 9 });
        return;
      }
      if (adminLevel === "city") {
        setAdminFocus((prev) => ({ ...prev, cityPsgc: properties.psgc_code }));
        setAdminLevel("barangay");
        mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 12 });
        return;
      }

      // Barangay is the leaf level: run AI analysis instead of drilling
      // further. connectionMix isn't on the rendered feature (kept off it
      // deliberately, see buildAdminChoroplethFeatureCollection), so look
      // it up from the stats computed alongside it.
      const stats = adminStats.find((s) => s.psgcCode === properties.psgc_code);
      runAnalysis({
        kind: "region",
        coordinates: [coords.lng, coords.lat],
        psgcCode: properties.psgc_code,
        name: properties.name,
        level: adminLevel,
        pointCount: properties.point_count,
        avgScore: properties.avg_score,
        connectionMix: stats?.connectionMix ?? {},
      });
    },
    [adminLevel, adminStats, runAnalysis],
  );

  const handleAdminLevelChange = useCallback((level: AdminLevel) => {
    setAdminLevel(level);
    if (level === "province") setAdminFocus({});
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

  // Earthquake/festival markers are informational, not a Selection —
  // there's no AI analysis for either, just a camera move so the user can
  // see what's nearby. Shared by both the Alerts and Festivals panels, and
  // by clicking a hazard marker directly on the map.
  const handleFocusLocation = useCallback((coordinates: [number, number]) => {
    mapRef.current?.flyTo({ center: coordinates, zoom: 9 });
  }, []);

  // The marker click itself carries the same info already shown in the
  // Alerts panel, so only the coordinates matter here.
  const handleHazardClick = useCallback(
    (_properties: EarthquakeProperties, coords: mapboxgl.LngLat) => {
      handleFocusLocation([coords.lng, coords.lat]);
    },
    [handleFocusLocation],
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
    } else if (action.type === "setView") {
      setViewMode(action.mode);
      if (action.mode === "choropleth-admin") {
        const level = action.adminLevel ?? "province";
        setAdminLevel(level);
        if (level === "province") setAdminFocus({});
      }
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <Header data={data} />
      <KpiBar data={data} />
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <LeftPanel
          earthquakeAlerts={earthquakeAlerts}
          earthquakeLoading={earthquakeLoading}
          earthquakeError={earthquakeError}
          showEarthquakesOnMap={showEarthquakesOnMap}
          onToggleEarthquakesOnMap={setShowEarthquakesOnMap}
          onFocusEarthquake={handleFocusLocation}
          festivals={festivals}
          festivalsLoading={festivalsLoading}
          festivalsError={festivalsError}
          onFocusFestival={handleFocusLocation}
        />
        <main className="relative order-1 h-[45vh] w-full flex-shrink-0 lg:order-2 lg:h-auto lg:w-2/3 lg:flex-grow">
          {!data && !dataError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950 text-zinc-400">
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
                Loading network data...
              </div>
            </div>
          )}
          {dataError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950 text-red-400">
              {dataError}
            </div>
          )}
          <MapView
            ref={mapRef}
            data={data}
            viewMode={viewMode}
            filter={filter}
            adminBoundaryData={adminBoundaryData}
            hazards={earthquakeFeatures}
            showHazards={showEarthquakesOnMap}
            onFeatureClick={handleFeatureClick}
            onAreaClick={handleAreaClick}
            onAdminAreaClick={handleAdminAreaClick}
            onHazardClick={handleHazardClick}
          />
        </main>
        <Sidebar
          orderClassName="order-2 lg:order-3"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onResetView={() => {
            mapRef.current?.resetView();
            setAdminLevel("province");
            setAdminFocus({});
          }}
          adminLevel={adminLevel}
          onAdminLevelChange={handleAdminLevelChange}
          adminFocus={adminFocus}
          adminLoading={adminLoading}
          adminError={adminError}
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
    </div>
  );
}
