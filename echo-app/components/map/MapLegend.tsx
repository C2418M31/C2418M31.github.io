// Mirrors the SCORE_COLOR_RAMP stops in lib/mapbox/layers.ts. Kept as a
// separate CSS gradient (rather than reading the mapbox expression at
// runtime) since it's just five color stops — duplicated once, here, on
// purpose for simplicity.
const GRADIENT_CSS =
  "linear-gradient(to right, #B71C1C 0%, #E53935 30%, #FB8C00 50%, #FDD835 70%, #26A69A 85%, #1565C0 100%)";

export default function MapLegend() {
  return (
    <div className="absolute bottom-5 left-5 z-10 rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-sm text-zinc-300 shadow-lg backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Network Score</p>
      <div className="mt-2.5 h-2.5 w-48 rounded-full" style={{ background: GRADIENT_CSS }} />
      <div className="mt-1.5 flex w-48 justify-between text-[11px] text-zinc-500">
        <span>No connection</span>
        <span>Good</span>
      </div>
      <p className="mt-2.5 border-t border-zinc-800 pt-2 text-[11px] text-zinc-500">
        Boundaries view: gray cells have no crowdsource reports yet.
      </p>
    </div>
  );
}
