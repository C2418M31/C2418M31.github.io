import { Activity, Gauge, TriangleAlert, Wifi, type LucideIcon } from "lucide-react";
import { summarizeNetwork } from "@/lib/geo/summary";
import type { NetworkFeatureCollection } from "@/lib/geo/types";

interface KpiBarProps {
  data: NetworkFeatureCollection | null;
}

export default function KpiBar({ data }: KpiBarProps) {
  if (!data) {
    return (
      <div
        className="grid flex-shrink-0 grid-cols-2 gap-3 border-b border-zinc-800 bg-zinc-950 px-5 py-3 sm:grid-cols-4"
        aria-busy="true"
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-900" />
        ))}
      </div>
    );
  }

  const summary = summarizeNetwork(data);
  const topType = Object.entries(summary.connectionTypeCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="grid flex-shrink-0 grid-cols-2 gap-3 border-b border-zinc-800 bg-zinc-950 px-5 py-3 sm:grid-cols-4">
      <KpiCard icon={Activity} label="Crowdsource Reports" value={summary.totalReports.toLocaleString()} />
      <KpiCard icon={Gauge} label="Avg. Network Score" value={`${Math.round(summary.avgScore * 100)}%`} />
      <KpiCard
        icon={TriangleAlert}
        label="Poor Coverage"
        value={`${summary.poorCoveragePct.toFixed(0)}%`}
        tone={summary.poorCoveragePct > 25 ? "warn" : "default"}
      />
      <KpiCard
        icon={Wifi}
        label="Top Connection Type"
        value={
          topType
            ? `${topType[0]} (${Math.round((topType[1] / summary.totalReports) * 100)}%)`
            : "—"
        }
      />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5">
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
          tone === "warn" ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
        <p
          className={`text-base font-semibold ${tone === "warn" ? "text-amber-400" : "text-zinc-100"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
