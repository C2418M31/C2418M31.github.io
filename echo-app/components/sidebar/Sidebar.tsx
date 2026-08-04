import DashboardControls from "./DashboardControls";
import AnalysisPanel from "./AnalysisPanel";
import QueryPanel from "./QueryPanel";
import ChatPanel from "./ChatPanel";
import type { Selection, ViewMode } from "@/lib/geo/types";
import type { AnalyzeResult, ChatAction, ChatContext, QueryFilter } from "@/lib/ai/types";

interface SidebarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onResetView: () => void;
  selection: Selection | null;
  analysisLoading: boolean;
  analysisResult: AnalyzeResult | null;
  analysisError: string | null;
  chatContext: ChatContext;
  onChatAction: (action: ChatAction) => void;
  onFilter: (filter: QueryFilter | null) => void;
}

export default function Sidebar({
  viewMode,
  onViewModeChange,
  onResetView,
  selection,
  analysisLoading,
  analysisResult,
  analysisError,
  chatContext,
  onChatAction,
  onFilter,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-1/3 flex-col border-l border-gray-700 bg-gray-800 p-6 shadow-2xl">
      <div className="mb-6 flex flex-shrink-0 items-center">
        <h1 className="text-2xl font-bold text-white">Network Intelligence Hub</h1>
      </div>
      <div className="flex-grow overflow-y-auto">
        <DashboardControls
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onResetView={onResetView}
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
