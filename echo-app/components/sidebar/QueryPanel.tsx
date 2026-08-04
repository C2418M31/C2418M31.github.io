"use client";

import { useState, type FormEvent } from "react";
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
    <div className="mb-6 rounded-lg bg-gray-700 p-4">
      <h2 className="mb-3 border-b border-gray-600 pb-2 text-lg font-semibold">Ask the Data</h2>
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder='e.g. "show 4G users with poor signal"'
          className="flex-grow rounded-l-md border-gray-600 bg-gray-800 p-2 text-sm text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-r-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "..." : "Filter"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {activeFilter && (
        <div className="mt-3 flex items-start justify-between gap-2 rounded-md bg-gray-800 p-2 text-xs text-gray-300">
          <span>{activeFilter.explanation}</span>
          <button
            type="button"
            onClick={clearFilter}
            className="whitespace-nowrap text-blue-400 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
