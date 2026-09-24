import { cn } from "@/lib/cn";
import { formatScore, MAX_SCORE, scoreTone, type ScoreTone } from "@/lib/scores";

const TONES: Record<ScoreTone, string> = {
  top: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  good: "bg-brand-50 text-brand-700 ring-brand-200",
  meh: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-rose-50 text-rose-700 ring-rose-200",
  none: "bg-slate-50 text-slate-400 ring-slate-200",
};

export function ScoreBadge({
  value,
  size = "md",
  showMax = false,
  className,
}: {
  value: number | null | undefined;
  size?: "sm" | "md" | "lg";
  showMax?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-0.5 rounded-full font-semibold tabular-nums ring-1 ring-inset",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        size === "lg" && "px-3.5 py-1.5 text-xl",
        TONES[scoreTone(value)],
        className,
      )}
    >
      {formatScore(value)}
      {showMax && value != null && <span className="text-[0.7em] font-medium opacity-60">/{MAX_SCORE}</span>}
    </span>
  );
}
