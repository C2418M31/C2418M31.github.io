export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export const INITIAL_VIEW_STATE = {
  center: [122, 13] as [number, number],
  zoom: 5.5,
  pitch: 0,
  bearing: 0,
};

export const QUALITY_COLORS = {
  good: "#4CAF50",
  slow: "#FF9800",
  none: "#F44336",
} as const;
