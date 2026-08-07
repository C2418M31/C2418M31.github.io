import { NextResponse } from "next/server";
import { fetchRawEarthquakes } from "@/lib/hazards/usgs";
import { getCurrentNetworkData } from "@/lib/data/store";
import { computeAreaStats } from "@/lib/geo/area";
import type { EarthquakeAlert } from "@/lib/hazards/types";

// Uses node:fs (via getCurrentNetworkData) and a real outbound fetch to USGS.
export const runtime = "nodejs";

/** How close a crowdsource reading has to be to an epicenter to count as "nearby". */
const NEARBY_RADIUS_KM = 50;

/**
 * Recent significant Philippine earthquakes (USGS, M4.0+, last 7 days),
 * each annotated with how many currently-active crowdsource readings fall
 * within NEARBY_RADIUS_KM — so this reads as "does this affect our
 * network footprint" rather than a generic news feed. If the network
 * dataset can't be loaded for some reason, that's not a reason to fail
 * the whole alerts feed — it just means nearbyPointCount comes back 0
 * for everything.
 */
export async function GET() {
  try {
    const [rawFeatures, networkData] = await Promise.all([
      fetchRawEarthquakes(),
      getCurrentNetworkData().catch(() => null),
    ]);

    const alerts: EarthquakeAlert[] = rawFeatures.map((f) => {
      const [lng, lat, depthKm] = f.geometry.coordinates;
      const nearbyPointCount = networkData
        ? computeAreaStats(networkData, [lng, lat], NEARBY_RADIUS_KM).userCount
        : 0;

      return {
        id: String(f.id),
        magnitude: f.properties.mag ?? 0,
        place: f.properties.place ?? "Unknown location",
        time: new Date(f.properties.time).toISOString(),
        depthKm: depthKm ?? 0,
        coordinates: [lng, lat],
        nearbyPointCount,
      };
    });

    return NextResponse.json({ earthquakes: alerts });
  } catch (err) {
    console.error("[/api/hazards/earthquakes]", err);
    return NextResponse.json({ error: "Failed to load earthquake data." }, { status: 502 });
  }
}
