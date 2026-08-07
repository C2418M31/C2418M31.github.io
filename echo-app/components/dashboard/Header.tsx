import Link from "next/link";
import { Radio, UploadCloud } from "lucide-react";
import { summarizeNetwork } from "@/lib/geo/summary";
import type { NetworkFeatureCollection } from "@/lib/geo/types";

interface HeaderProps {
  data: NetworkFeatureCollection | null;
}

export default function Header({ data }: HeaderProps) {
  const latest = data ? summarizeNetwork(data).latestTimestamp : null;

  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
          <Radio className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
            Network Intelligence Hub
          </h1>
          <p className="text-xs text-zinc-500">
            {latest
              ? `Data as of ${new Date(latest).toLocaleString()}`
              : "Crowdsource dataset — no report timestamps yet"}
          </p>
        </div>
      </div>
      <Link
        href="/admin/upload"
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
      >
        <UploadCloud className="h-4 w-4" aria-hidden="true" />
        Upload Data
      </Link>
    </header>
  );
}
