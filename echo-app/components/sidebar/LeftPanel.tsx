"use client";

import AlertsPanel from "./AlertsPanel";
import FestivalsPanel from "./FestivalsPanel";
import type { EarthquakeAlert } from "@/lib/hazards/types";
import type { UpcomingFestival } from "@/lib/events/festivals";

interface LeftPanelProps {
  earthquakeAlerts: EarthquakeAlert[];
  earthquakeLoading: boolean;
  earthquakeError: string | null;
  showEarthquakesOnMap: boolean;
  onToggleEarthquakesOnMap: (show: boolean) => void;
  onFocusEarthquake: (coordinates: [number, number]) => void;
  festivals: UpcomingFestival[];
  festivalsLoading: boolean;
  festivalsError: string | null;
  onFocusFestival: (coordinates: [number, number]) => void;
}

/**
 * Situational-awareness rail, separate from the right Sidebar's map
 * controls / AI analysis — groups "things happening around your network
 * that aren't your data" (hazards, events) rather than "things you do to
 * your data" (filter, drill down, chat).
 */
export default function LeftPanel({
  earthquakeAlerts,
  earthquakeLoading,
  earthquakeError,
  showEarthquakesOnMap,
  onToggleEarthquakesOnMap,
  onFocusEarthquake,
  festivals,
  festivalsLoading,
  festivalsError,
  onFocusFestival,
}: LeftPanelProps) {
  return (
    <aside className="order-3 flex min-h-0 w-full flex-shrink-0 flex-col border-b border-zinc-800 bg-zinc-950 p-4 lg:order-1 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex-grow space-y-4 overflow-y-auto">
        <AlertsPanel
          alerts={earthquakeAlerts}
          loading={earthquakeLoading}
          error={earthquakeError}
          showOnMap={showEarthquakesOnMap}
          onToggleShowOnMap={onToggleEarthquakesOnMap}
          onFocus={onFocusEarthquake}
        />
        <FestivalsPanel
          festivals={festivals}
          loading={festivalsLoading}
          error={festivalsError}
          onFocus={onFocusFestival}
        />
      </div>
    </aside>
  );
}
