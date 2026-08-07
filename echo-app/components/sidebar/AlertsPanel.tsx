"use client";

import { Activity, MapPinned } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import type { EarthquakeAlert } from "@/lib/hazards/types";

interface AlertsPanelProps {
  alerts: EarthquakeAlert[];
  loading: boolean;
  error: string | null;
  showOnMap: boolean;
  onToggleShowOnMap: (show: boolean) => void;
  onFocus: (coordinates: [number, number]) => void;
}

// Distinct from QualityBadge's colors on purpose — this is a hazard
// severity scale, not a network-quality scale, and the two shouldn't read
// as the same kind of signal at a glance.
function severityStyles(magnitude: number): { text: string; bg: string; dot: string } {
  if (magnitude >= 6) return { text: "text-red-300", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-400" };
  if (magnitude >= 5)
    return { text: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/20", dot: "bg-orange-400" };
  return { text: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" };
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AlertsPanel({
  alerts,
  loading,
  error,
  showOnMap,
  onToggleShowOnMap,
  onFocus,
}: AlertsPanelProps) {
  return (
    <Card
      title="Seismic Activity"
      icon={Activity}
      action={
        <Button
          variant={showOnMap ? "primary" : "secondary"}
          onClick={() => onToggleShowOnMap(!showOnMap)}
          className="px-2.5 py-1 text-xs"
        >
          <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
          On map
        </Button>
      }
    >
      {loading && (
        <div className="py-6 text-center text-zinc-500">
          <Spinner className="h-5 w-5" />
        </div>
      )}

      {error && !loading && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && alerts.length === 0 && (
        <p className="py-4 text-center text-sm text-zinc-500">
          No M4.0+ earthquakes in the Philippines in the past 7 days.
        </p>
      )}

      {!loading && !error && alerts.length > 0 && (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {alerts.map((a) => {
            const s = severityStyles(a.magnitude);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onFocus(a.coordinates)}
                  className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors hover:bg-zinc-800/60 ${s.bg}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${s.text}`}>
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
                      M{a.magnitude.toFixed(1)}
                    </span>
                    <span className="text-xs text-zinc-500">{timeAgo(a.time)}</span>
                  </div>
                  <p className="mt-1 text-zinc-300">{a.place}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Depth {a.depthKm.toFixed(0)}km
                    {a.nearbyPointCount > 0 && ` · ~${a.nearbyPointCount} monitored points nearby`}
                  </p>
                  {a.magnitude >= 5 && (
                    <p className="mt-1.5 text-xs text-zinc-400">
                      Verify tower status nearby; expect a possible usage spike from residents
                      checking connectivity.
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
