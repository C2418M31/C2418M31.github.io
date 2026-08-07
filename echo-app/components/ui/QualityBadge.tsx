// A superset of lib/geo/scoring.ts's NetworkQuality: "No Data" is an
// AI-analysis-only state (a region with zero crowdsource reports), never
// produced by the raw signal-strength scoring in lib/geo/scoring.ts.
export type QualityBadgeValue = "Good" | "Slow" | "No Connection" | "No Data";

// Colors stay semantically the same as before (green=good, red=bad) —
// unlike the map's color ramp, this badge always shows its label as text
// right next to the color, so it isn't relying on hue alone the way an
// unlabeled map cell would be.
const STYLES: Record<QualityBadgeValue, { dot: string; text: string; bg: string }> = {
  Good: { dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20" },
  Slow: { dot: "bg-amber-400", text: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20" },
  "No Connection": { dot: "bg-red-400", text: "text-red-300", bg: "bg-red-500/10 border-red-500/20" },
  "No Data": { dot: "bg-zinc-400", text: "text-zinc-300", bg: "bg-zinc-500/10 border-zinc-500/20" },
};

export default function QualityBadge({ quality }: { quality: QualityBadgeValue }) {
  const s = STYLES[quality];
  return (
    <div
      className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
      {quality}
    </div>
  );
}
