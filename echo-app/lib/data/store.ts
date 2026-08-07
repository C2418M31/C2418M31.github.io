import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { NetworkFeatureCollection } from "@/lib/geo/types";

/**
 * Interim storage for the currently-active crowdsource dataset.
 *
 * IMPORTANT: this writes to the local filesystem. That's fine for local
 * dev and any traditional (non-serverless) Node host, but it will NOT
 * persist on serverless platforms with read-only/ephemeral filesystems
 * (e.g. Vercel's default runtime) — an upload would appear to succeed
 * and then vanish on the next cold start. Before deploying this upload
 * flow anywhere serverless, swap this module's implementation for a
 * real store (a database, or blob storage) without changing its
 * exported function signatures — every caller (the upload route, the
 * network route, and eventually the mobile-fed ingestion API) goes
 * through this file only.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const CURRENT_DATA_PATH = path.join(DATA_DIR, "network-data.json");
const SEED_DATA_PATH = path.join(process.cwd(), "public", "data", "network_data.geojson");

let memoryCache: NetworkFeatureCollection | null = null;

export async function getCurrentNetworkData(): Promise<NetworkFeatureCollection> {
  if (memoryCache) return memoryCache;

  try {
    const raw = await readFile(CURRENT_DATA_PATH, "utf-8");
    memoryCache = JSON.parse(raw) as NetworkFeatureCollection;
    return memoryCache;
  } catch {
    // No uploaded dataset yet — fall back to the bundled seed sample.
    const raw = await readFile(SEED_DATA_PATH, "utf-8");
    memoryCache = JSON.parse(raw) as NetworkFeatureCollection;
    return memoryCache;
  }
}

export async function setCurrentNetworkData(data: NetworkFeatureCollection): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CURRENT_DATA_PATH, JSON.stringify(data), "utf-8");
  memoryCache = data;
}
