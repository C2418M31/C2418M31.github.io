"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, X } from "lucide-react";
import Card from "@/components/ui/Card";
import type { QueryFilter } from "@/lib/ai/types";

interface QueryPanelProps {
  onFilter: (filter: QueryFilter | null) => void;
}

export default function QueryPanel({ onFilter }: QueryPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<QueryFilter | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed.");

      setActiveFilter(data as QueryFilter);
      onFilter(data as QueryFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function clearFilter() {
    setActiveFilter(null);
    setInput("");
    setError(null);
    onFilter(null);
  }

  return (
    <Card title="Ask the Data" icon={Sparkles}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder='e.g. "show 4G users with poor signal"'
          className="flex-grow rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Filter"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {activeFilter && (
        <div className="mt-3 flex items-start justify-between gap-2 rounded-lg bg-zinc-800/60 p-2.5 text-xs text-zinc-300">
          <span>{activeFilter.explanation}</span>
          <button
            type="button"
            onClick={clearFilter}
            className="flex flex-shrink-0 items-center gap-1 text-zinc-500 hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </button>
        </div>
      )}
    </Card>
  );
}
