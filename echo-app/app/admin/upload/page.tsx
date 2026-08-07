"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, FileSpreadsheet, TriangleAlert, UploadCloud } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface UploadResponse {
  committed: boolean;
  validCount: number;
  totalRows: number;
  errors: { row: number; message: string }[];
}

interface ApiError {
  error: string;
}

type Stage = "idle" | "previewing" | "previewed" | "committing" | "committed" | "error";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(commit: boolean) {
    if (!file) return;
    setStage(commit ? "committing" : "previewing");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/data/upload${commit ? "?commit=true" : ""}`, {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as UploadResponse | ApiError;

      if (!res.ok || "error" in json) {
        setErrorMessage("error" in json ? json.error : "Upload failed.");
        setStage("error");
        return;
      }

      setResult(json);
      setStage(commit ? "committed" : "previewed");
    } catch {
      setErrorMessage("Network error while uploading.");
      setStage("error");
    }
  }

  const busy = stage === "previewing" || stage === "committing";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-50">Upload Crowdsource Data</h1>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>

        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <p>
            This page has no access control yet. Treat it as an internal/dev tool until an auth
            gate is added — anyone with the URL can currently overwrite the live dataset. This is
            also an interim path: once the mobile app reports through a real backend, this upload
            flow can stay as a manual override, but live data won&apos;t depend on it.
          </p>
        </div>

        <Card title="Spreadsheet Upload" icon={FileSpreadsheet}>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Spreadsheet (.xlsx / .xls)
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setStage("idle");
              setResult(null);
              setErrorMessage(null);
            }}
            className="mb-4 block w-full rounded-lg border border-zinc-700 bg-zinc-800/60 p-2 text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-200 hover:file:bg-zinc-600"
          />

          <p className="mb-4 text-xs text-zinc-500">
            Expected columns (any casing/spacing): latitude, longitude, signal_strength,
            connection_type, timestamp. Optional: location_name, mobile_number, sim_slot.
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              disabled={!file || busy}
              onClick={() => submit(false)}
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              {stage === "previewing" ? "Parsing..." : "Preview"}
            </Button>
            <Button
              variant="primary"
              disabled={!file || stage !== "previewed" || (result?.validCount ?? 0) === 0}
              onClick={() => submit(true)}
            >
              {stage === "committing" ? "Committing..." : "Commit to live dataset"}
            </Button>
          </div>

          {busy && (
            <div className="mt-4">
              <Spinner className="h-6 w-6" />
            </div>
          )}

          {stage === "error" && errorMessage && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {errorMessage}
            </div>
          )}

          {result && (stage === "previewed" || stage === "committed") && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-zinc-300">
                {stage === "committed" ? (
                  <span className="font-semibold text-emerald-400">Committed. </span>
                ) : null}
                {result.validCount} of {result.totalRows} rows parsed successfully.
                {result.errors.length > 0 && ` ${result.errors.length} row(s) had problems.`}
              </p>

              {result.errors.length > 0 && (
                <div className="max-h-64 overflow-y-auto rounded-lg bg-zinc-800/60 p-3 text-xs text-red-300">
                  {result.errors.map((e) => (
                    <div key={e.row} className="py-0.5">
                      Row {e.row}: {e.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
