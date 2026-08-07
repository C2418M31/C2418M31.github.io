"use client";

import { useEffect, useState } from "react";
import { scoreFeatures } from "@/lib/geo/scoring";
import type { NetworkFeatureCollection } from "@/lib/geo/types";

export function useNetworkData(url = "/api/data/network") {
  const [data, setData] = useState<NetworkFeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.json();
      })
      .then((json: NetworkFeatureCollection) => {
        if (cancelled) return;
        setData(scoreFeatures(json));
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, error };
}
