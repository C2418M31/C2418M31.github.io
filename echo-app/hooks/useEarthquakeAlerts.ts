"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchEarthquakeAlerts } from "@/lib/hazards/client";
import type { EarthquakeAlert } from "@/lib/hazards/types";

// USGS data doesn't need to be near-real-time for this use case; a quake
// that happened doesn't stop being relevant if we're 10 minutes late
// noticing it. Polling instead of a websocket keeps this simple.
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function useEarthquakeAlerts() {
  const [alerts, setAlerts] = useState<EarthquakeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchEarthquakeAlerts();
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load earthquake data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { alerts, loading, error, refresh: load };
}
