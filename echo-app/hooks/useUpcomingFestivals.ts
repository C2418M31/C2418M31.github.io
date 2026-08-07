"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUpcomingFestivals } from "@/lib/events/client";
import type { UpcomingFestival } from "@/lib/events/festivals";

// Festival dates don't change minute to minute — this only needs to
// refresh often enough to notice the day roll over, unlike the
// earthquake feed's 10-minute polling.
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export function useUpcomingFestivals() {
  const [festivals, setFestivals] = useState<UpcomingFestival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchUpcomingFestivals();
      setFestivals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load festival data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { festivals, loading, error, refresh: load };
}
