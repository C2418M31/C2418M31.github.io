"use client";

import { Circle, Flame, Grid3x3, Layers, RotateCcw, SlidersHorizontal } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ToggleGroup from "@/components/ui/ToggleGroup";
import type { AdminFocus, AdminLevel, ViewMode } from "@/lib/geo/types";

interface DashboardControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onResetView: () => void;
  adminLevel: AdminLevel;
  onAdminLevelChange: (level: AdminLevel) => void;
  adminFocus: AdminFocus;
  adminLoading: boolean;
  adminError: string | null;
}

export default function DashboardControls({
  viewMode,
  onViewModeChange,
  onResetView,
  adminLevel,
  onAdminLevelChange,
  adminFocus,
  adminLoading,
  adminError,
}: DashboardControlsProps) {
  return (
    <Card title="Dashboard Controls" icon={SlidersHorizontal}>
      <Button variant="secondary" onClick={onResetView} className="w-full">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset Map View
      </Button>

      <div className="mt-3">
        <ToggleGroup
          value={viewMode}
          onChange={onViewModeChange}
          options={[
            { value: "points", label: "Points", icon: Circle },
            { value: "heatmap", label: "Heatmap", icon: Flame },
            { value: "choropleth-grid", label: "Grid", icon: Grid3x3 },
            { value: "choropleth-admin", label: "Boundaries", icon: Layers },
          ]}
        />
      </div>

      {viewMode === "choropleth-admin" && (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
            Boundary level (click a shape on the map to drill down)
          </p>
          <ToggleGroup
            value={adminLevel}
            onChange={onAdminLevelChange}
            options={[
              { value: "province", label: "Province" },
              { value: "city", label: "City" },
              { value: "barangay", label: "Barangay" },
            ]}
          />
          {adminLevel !== "province" && (
            <p className="mt-2 text-xs text-zinc-500">
              {adminLevel === "city" && adminFocus.provincePsgc
                ? "Showing cities/municipalities in the selected province."
                : adminLevel === "barangay" && adminFocus.cityPsgc
                  ? "Showing barangays in the selected city/municipality."
                  : "Click a shape at the previous level first."}
            </p>
          )}
          {adminLoading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
              Loading boundary data...
            </div>
          )}
          {adminError && !adminLoading && (
            <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300">
              {adminError}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
