import { QUALITY_COLORS } from "@/lib/mapbox/config";

const ITEMS = [
  { label: "Good Connection", color: QUALITY_COLORS.good },
  { label: "Slow Connection", color: QUALITY_COLORS.slow },
  { label: "No Connection", color: QUALITY_COLORS.none },
];

export default function MapLegend() {
  return (
    <div className="absolute bottom-5 left-5 z-10 rounded-md border border-gray-600 bg-gray-800/90 p-3 text-sm text-gray-300">
      <strong className="text-white">Network Score</strong>
      {ITEMS.map((item) => (
        <div key={item.label} className="mt-1 flex items-center gap-2">
          <span
            className="inline-block h-3.5 w-3.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}
