import { Layers, MapPin, MousePointerClick, Smartphone } from "lucide-react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import QualityBadge from "@/components/ui/QualityBadge";
import type { Selection } from "@/lib/geo/types";
import type { AnalyzeResult } from "@/lib/ai/types";

interface AnalysisPanelProps {
  selection: Selection | null;
  loading: boolean;
  result: AnalyzeResult | null;
  error: string | null;
}

const SELECTION_ICON = { user: Smartphone, area: MapPin, region: Layers } as const;

export default function AnalysisPanel({ selection, loading, result, error }: AnalysisPanelProps) {
  return (
    <Card
      title="Network Analysis"
      icon={selection ? SELECTION_ICON[selection.kind] : MousePointerClick}
    >
      {!selection && !loading && (
        <div className="py-8 text-center text-sm text-zinc-500">
          <MousePointerClick className="mx-auto mb-2 h-6 w-6 text-zinc-600" aria-hidden="true" />
          <p>Click a user dot, an area, or a barangay boundary on the map to begin AI analysis.</p>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-zinc-500">
          <Spinner />
          <p className="mt-4 text-sm">Analyzing with AI...</p>
        </div>
      )}

      {error && !loading && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {selection && result && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" value={locationLabel(selection)} />
            <Field
              label="Coordinates"
              value={`${selection.coordinates[1].toFixed(5)}, ${selection.coordinates[0].toFixed(5)}`}
            />
          </div>

          {selection.kind === "user" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="User ID" value={selection.properties.mobile_number ?? "Unknown"} />
                <Field label="Connection Type" value={selection.properties.connection_type} />
                <Field label="Signal Strength" value={`${selection.properties.signal_strength} dBm`} />
              </div>
              <QualitySection label="Predicted Network Quality" quality={result.quality} />
            </div>
          )}

          {selection.kind === "area" && (
            <div className="space-y-3">
              <Field label="Users in 10km Radius" value={String(selection.userCount)} />
              <QualitySection label="Average Network Quality" quality={result.quality} />
              <ConnectionMixList mix={selection.connectionMix} />
            </div>
          )}

          {selection.kind === "region" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Boundary Level" value={capitalize(selection.level)} />
                <Field label="Crowdsource Reports" value={String(selection.pointCount)} />
                {result.priority && <Field label="Ops Priority" value={result.priority} />}
              </div>
              <QualitySection label="Network Quality" quality={result.quality} />
              <ConnectionMixList mix={selection.connectionMix} />
            </div>
          )}

          <TextBlock label="AI Summary" text={result.summary} />
          <TextBlock label="Recommended Action" text={result.recommendation} />
        </div>
      )}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-200">{value}</p>
    </div>
  );
}

function QualitySection({ label, quality }: { label: string; quality: AnalyzeResult["quality"] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <QualityBadge quality={quality} />
    </div>
  );
}

function TextBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="rounded-lg bg-zinc-800/60 p-3 text-sm text-zinc-300">{text}</p>
    </div>
  );
}

function ConnectionMixList({ mix }: { mix: Record<string, number> }) {
  const entries = Object.entries(mix);
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">No connection-type data for this selection.</p>;
  }
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">Connection Mix</p>
      <ul className="space-y-1">
        {entries.map(([type, count]) => (
          <li key={type} className="flex items-center justify-between text-sm text-zinc-300">
            <span>{type}</span>
            <span className="font-medium text-zinc-200">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function locationLabel(selection: Selection): string {
  if (selection.kind === "user") return selection.properties.location_name;
  if (selection.kind === "area") return selection.locationName;
  return selection.name;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
