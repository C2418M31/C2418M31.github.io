/**
 * Normalized shape of one earthquake event, regardless of which upstream
 * source produced it (today: USGS only). Kept separate from
 * lib/geo/types.ts's NetworkFeature/NetworkProperties since this is a
 * hazard signal, not a crowdsourced network reading — the two are related
 * (we cross-reference nearby point counts) but not the same kind of data.
 */
export interface EarthquakeAlert {
  id: string;
  /** Richter/moment magnitude as reported by the source. */
  magnitude: number;
  /** Human-readable place description, e.g. "23km SE of Davao City". */
  place: string;
  /** ISO 8601 timestamp of the event. */
  time: string;
  depthKm: number;
  coordinates: [number, number];
  /**
   * Count of crowdsourced network readings within NEARBY_RADIUS_KM (see
   * lib/hazards/usgs.ts) of this event's epicenter, computed server-side
   * against whatever dataset is currently active. Ties the hazard signal
   * to actual coverage footprint instead of being a generic news feed.
   */
  nearbyPointCount: number;
}
