import { NextResponse } from "next/server";
import { getCurrentNetworkData } from "@/lib/data/store";

// Uses node:fs to read the current dataset from disk.
export const runtime = "nodejs";

/**
 * Serves the currently-active crowdsource dataset: whatever was last
 * uploaded via /api/data/upload, or the bundled seed sample if nothing
 * has been uploaded yet. useNetworkData() fetches this instead of the
 * static geojson file directly, so swapping this route's backing store
 * for a real database later doesn't require any client-side changes.
 */
export async function GET() {
  try {
    const data = await getCurrentNetworkData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/data/network]", err);
    return NextResponse.json({ error: "Failed to load network data." }, { status: 500 });
  }
}
