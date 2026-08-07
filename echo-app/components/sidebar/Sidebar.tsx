import DashboardControls from "./DashboardControls";
import AnalysisPanel from "./AnalysisPanel";
import QueryPanel from "./QueryPanel";
import ChatPanel from "./ChatPanel";
import type { AdminFocus, AdminLevel, Selection, ViewMode } from "@/lib/geo/types";
import type { AnalyzeResult, ChatAction, ChatContext, QueryFilter } from "@/lib/ai/types";

interface SidebarProps {
  /** Flex `order-*` classes, set by the parent since this needs to be a direct flex-row child to work. */
  orderClassName?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onResetView: () => void;
  adminLevel: AdminLevel;
  onAdminLevelChange: (level: AdminLevel) => void;
  adminFocus: AdminFocus;
  adminLoading: boolean;
  adminError: string | null;
  selection: Selection | null;
  analysisLoading: boolean;
  analysisResult: AnalyzeResult | null;
  analysisError: string | null;
  chatContext: ChatContext;
  onChatAction: (action: ChatAction) => void;
  onFilter: (filter: QueryFilter | null) => void;
}

// Earthquake/festival "situational awareness" panels moved to LeftPanel —
// this sidebar is specifically map controls + AI analysis + chat now.
export default function Sidebar({
  orderClassName = "",
  viewMode,
  onViewModeChange,
  onResetView,
  adminLevel,
  onAdminLevelChange,
  adminFocus,
  adminLoading,
  adminError,
  selection,
  analysisLoading,
  analysisResult,
  analysisError,
  chatContext,
  onChatAction,
  onFilter,
}: SidebarProps) {
  return (
    <aside
      className={`flex min-h-0 w-full flex-1 flex-col border-t border-zinc-800 bg-zinc-950 p-4 lg:w-1/3 lg:border-l lg:border-t-0 ${orderClassName}`}
    >
      {/* Page title now lives in Header.tsx, above the map+sidebar row —
          having it here too was a leftover duplicate from before the redesign. */}
      <div className="flex-grow space-y-4 overflow-y-auto">
        <DashboardControls
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onResetView={onResetView}
          adminLevel={adminLevel}
          onAdminLevelChange={onAdminLevelChange}
          adminFocus={adminFocus}
          adminLoading={adminLoading}
          adminError={adminError}
        />
        <QueryPanel onFilter={onFilter} />
        <AnalysisPanel
          selection={selection}
          loading={analysisLoading}
          result={analysisResult}
          error={analysisError}
        />
        <ChatPanel context={chatContext} onAction={onChatAction} />
      </div>
    </aside>
  );
}
