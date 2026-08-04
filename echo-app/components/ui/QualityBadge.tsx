import type { NetworkQuality } from "@/lib/geo/scoring";

const STYLES: Record<NetworkQuality, string> = {
  Good: "bg-green-500 text-white",
  Slow: "bg-orange-500 text-black",
  "No Connection": "bg-red-500 text-white",
};

export default function QualityBadge({ quality }: { quality: NetworkQuality }) {
  return (
    <div className={`mt-1 rounded-md p-2 text-center text-lg font-bold ${STYLES[quality]}`}>
      {quality}
    </div>
  );
}
