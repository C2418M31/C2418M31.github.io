interface SpinnerProps {
  /** Full Tailwind size classes, e.g. "h-8 w-8" or "h-3 w-3". */
  className?: string;
}

export default function Spinner({ className = "h-8 w-8" }: SpinnerProps) {
  return (
    <div
      className={`mx-auto animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500 ${className}`}
    />
  );
}
