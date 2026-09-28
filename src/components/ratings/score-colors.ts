import { scoreTone, type ScoreTone } from "@/lib/scores";

/**
 * Color de cada nota (1 rojo → 4 verde), con la misma escala que ScoreBadge.
 * Solo tonos 50/200/500, que tienen variante en modo oscuro (globals.css).
 */
const COLORS: Record<ScoreTone, { icon: string; solid: string; soft: string; hover: string }> = {
  low: { icon: "text-rose-500", solid: "bg-rose-500 shadow-rose-500/30", soft: "border-rose-500 bg-rose-50", hover: "hover:border-rose-200 hover:bg-rose-50" },
  meh: { icon: "text-amber-500", solid: "bg-amber-500 shadow-amber-500/30", soft: "border-amber-500 bg-amber-50", hover: "hover:border-amber-200 hover:bg-amber-50" },
  good: { icon: "text-brand-500", solid: "bg-brand-500 shadow-brand-500/30", soft: "border-brand-500 bg-brand-50", hover: "hover:border-brand-200 hover:bg-brand-50" },
  top: { icon: "text-emerald-500", solid: "bg-emerald-500 shadow-emerald-500/30", soft: "border-emerald-500 bg-emerald-50", hover: "hover:border-emerald-200 hover:bg-emerald-50" },
  none: { icon: "text-slate-400", solid: "bg-slate-400 shadow-slate-400/30", soft: "border-slate-400 bg-slate-50", hover: "hover:border-slate-200 hover:bg-slate-50" },
};

export function scoreColors(score: number) {
  return COLORS[scoreTone(score)];
}
