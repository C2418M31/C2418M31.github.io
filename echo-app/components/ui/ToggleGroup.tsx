"use client";

import type { LucideIcon } from "lucide-react";

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface ToggleGroupProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pill-shaped segmented control. Icons are optional per-option, for backward compatibility. */
export default function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: ToggleGroupProps<T>) {
  return (
    <div className="flex gap-1 rounded-lg bg-zinc-800/60 p-1">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
