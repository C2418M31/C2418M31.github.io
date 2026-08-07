import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  icon?: LucideIcon;
  /** Rendered top-right of the header row, e.g. a small status pill or link. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Shared panel surface for the whole app. Replaces the old pattern of every
 * sidebar panel hand-rolling `rounded-lg bg-gray-700 p-4` plus its own
 * `border-b pb-2` heading — one place to keep that consistent now.
 */
export default function Card({ title, icon: Icon, action, children, className = "" }: CardProps) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900 p-4 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            {Icon && <Icon className="h-4 w-4 text-indigo-400" aria-hidden="true" />}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
