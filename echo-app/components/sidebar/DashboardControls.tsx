"use client";

import ToggleGroup from "@/components/ui/ToggleGroup";
import type { ViewMode } from "@/lib/geo/types";

interface DashboardControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onResetView: () => void;
}

export default function DashboardControls({
  viewMode,
  onViewModeChange,
  onResetView,
}: DashboardControlsProps) {
  return (
    <div className="mb-6 rounded-lg bg-gray-700 p-4">
      <h2 className="mb-3 border-b border-gray-600 pb-2 text-lg font-semibold">
        Dashboard Controls
      </h2>
      <button
        type="button"
        onClick={onResetView}
        className="mt-2 w-full rounded-md bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        Reset Map View
      </button>
      <ToggleGroup
        value={viewMode}
        onChange={onViewModeChange}
        options={[
          { value: "points", label: "Points" },
          { value: "heatmap", label: "Heatmap" },
          { value: "choropleth", label: "Choropleth" },
        ]}
      />
    </div>
  );
}
