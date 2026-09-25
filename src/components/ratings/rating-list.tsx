"use client";

import { cn } from "@/lib/cn";
import { scoreOption, SCORE_OPTIONS } from "@/lib/scores";
import type { Rating } from "@/lib/types";
import { MemberAvatar } from "@/components/member-avatar";
import { useIdentity } from "@/components/identity/identity-provider";
import { ShowMoreList } from "@/components/ui/show-more";

export function RatingList({
  ratings,
  highlightId,
  emptyMessage = "Todavía no ha votado nadie.",
}: {
  ratings: Rating[];
  highlightId?: string;
  emptyMessage?: string;
}) {
  const { memberById } = useIdentity();

  if (ratings.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ShowMoreList items={ratings}>
      {(visible) => (
        <ul className="divide-y divide-slate-100">
          {visible.map((rating) => {
            const member = memberById(rating.member_id);
            const option = scoreOption(rating.score);
            return (
              <li key={rating.id} className="flex gap-3 py-3">
                <MemberAvatar member={member} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-brand-900">
                      {member?.name ?? "Alguien"}
                      {rating.member_id === highlightId && <span className="ml-1.5 text-xs font-medium text-brand-500">(tú)</span>}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-sm font-semibold tabular-nums text-brand-800">
                      {option?.emoji} {rating.score}
                    </span>
                  </div>
                  {rating.comment && <p className="mt-0.5 text-sm text-slate-600">{rating.comment}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ShowMoreList>
  );
}

/**
 * Reparto de votos 1–4 en mini barras. Pulsar una barra filtra los comentarios
 * por esa nota; pulsarla otra vez quita el filtro.
 */
export function ScoreDistribution({
  ratings,
  selected,
  onSelect,
}: {
  ratings: Rating[];
  selected: number | null;
  onSelect: (score: number | null) => void;
}) {
  const counts = SCORE_OPTIONS.map((option) => ({
    ...option,
    count: ratings.filter((rating) => rating.score === option.value).length,
  }));
  const max = Math.max(1, ...counts.map((item) => item.count));

  return (
    <div className="space-y-1" role="group" aria-label="Reparto de votos. Pulsa una nota para filtrar los comentarios.">
      {[...counts].reverse().map((item) => {
        const active = selected === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(active ? null : item.value)}
            disabled={item.count === 0}
            aria-pressed={active}
            title={active ? "Ver todos los comentarios" : `Ver solo quién puso un ${item.value}`}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-xs transition-all duration-200 disabled:cursor-default disabled:opacity-60",
              active ? "bg-brand-50 ring-1 ring-brand-300" : "enabled:hover:bg-slate-50",
              selected !== null && !active && "opacity-50",
            )}
          >
            <span className="w-5 text-center" aria-hidden>{item.emoji}</span>
            <span className="w-2 font-semibold tabular-nums text-slate-500">{item.value}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full origin-left rounded-full bg-brand-500 animate-grow"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </span>
            <span className="w-4 text-right tabular-nums text-slate-500">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}
