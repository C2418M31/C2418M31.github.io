import { NextResponse } from "next/server";
import { getCurrentNetworkData } from "@/lib/data/store";
import { computeAreaStats } from "@/lib/geo/area";
import { daysBetween, FESTIVALS, nextOccurrence, type UpcomingFestival } from "@/lib/events/festivals";

// Uses node:fs via getCurrentNetworkData.
export const runtime = "nodejs";

const NEARBY_RADIUS_KM = 30;
/** How many upcoming festivals to return, soonest first. */
const MAX_RESULTS = 8;

/**
 * Computes each curated festival's next occurrence from today, sorts by
 * how soon it is, and annotates it with nearby crowdsource point count —
 * same cross-referencing idea as /api/hazards/earthquakes, so this reads
 * as "does this affect our network footprint" rather than a plain events
 * calendar.
 */
export async function GET() {
  try {
    const networkData = await getCurrentNetworkData().catch(() => null);
    const now = new Date();

    const upcoming: UpcomingFestival[] = FESTIVALS.map((f) => {
      const next = nextOccurrence(f.month, f.day, now);
      const nearbyPointCount = networkData
        ? computeAreaStats(networkData, f.coordinates, NEARBY_RADIUS_KM).userCount
        : 0;
      return {
        ...f,
        nextDate: next.toISOString(),
        daysUntil: daysBetween(now, next),
        nearbyPointCount,
      };
    })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, MAX_RESULTS);

    return NextResponse.json({ festivals: upcoming });
  } catch (err) {
    console.error("[/api/events/festivals]", err);
    return NextResponse.json({ error: "Failed to load festival data." }, { status: 500 });
  }
}
