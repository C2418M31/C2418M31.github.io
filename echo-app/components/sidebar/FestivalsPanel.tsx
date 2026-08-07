"use client";

import { PartyPopper } from "lucide-react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import type { UpcomingFestival } from "@/lib/events/festivals";

interface FestivalsPanelProps {
  festivals: UpcomingFestival[];
  loading: boolean;
  error: string | null;
  onFocus: (coordinates: [number, number]) => void;
}

function whenLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil < 30) return `In ${daysUntil} days`;
  const months = Math.round(daysUntil / 30);
  return `In ~${months} month${months === 1 ? "" : "s"}`;
}

export default function FestivalsPanel({ festivals, loading, error, onFocus }: FestivalsPanelProps) {
  return (
    <Card title="Upcoming Festivals" icon={PartyPopper}>
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

      {!loading && !error && festivals.length === 0 && (
        <p className="py-4 text-center text-sm text-zinc-500">No upcoming festivals tracked.</p>
      )}

      {!loading && !error && festivals.length > 0 && (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {festivals.map((f) => (
            <li key={f.name}>
              <button
                type="button"
                onClick={() => onFocus(f.coordinates)}
                className="w-full rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 p-2.5 text-left text-sm transition-colors hover:bg-fuchsia-500/15"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-fuchsia-300">{f.name}</span>
                  <span className="text-xs text-zinc-500">{whenLabel(f.daysUntil)}</span>
                </div>
                <p className="mt-1 text-zinc-300">{f.location}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {f.nearbyPointCount > 0 && `~${f.nearbyPointCount} monitored points nearby`}
                  {f.note && (f.nearbyPointCount > 0 ? " · " : "") + f.note}
                </p>
                {f.daysUntil <= 30 && (
                  <p className="mt-1.5 text-xs text-zinc-400">
                    Expect a temporary population surge in this area — consider a data-pack promo
                    or short-term capacity check.
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
