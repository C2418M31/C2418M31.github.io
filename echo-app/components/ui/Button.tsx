import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-glow",
  secondary: "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
  ghost: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
  danger: "bg-red-600/90 text-white hover:bg-red-600",
};

/** Shared button used everywhere instead of each file hand-rolling its own color/hover classes. */
export default function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_STYLES[variant]} ${className}`}
    />
  );
}
