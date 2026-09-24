"use client";

import { scoreOption, SCORE_OPTIONS } from "@/lib/scores";
import type { Rating } from "@/lib/types";
import { MemberAvatar } from "@/components/member-avatar";
import { useIdentity } from "@/components/identity/identity-provider";

export function RatingList({ ratings, highlightId }: { ratings: Rating[]; highlightId?: string }) {
  const { memberById } = useIdentity();

  if (ratings.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">Todavía no ha votado nadie.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {ratings.map((rating) => {
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
  );
}

/** Reparto de votos 1–4 en mini barras. */
export function ScoreDistribution({ ratings }: { ratings: Rating[] }) {
  const counts = SCORE_OPTIONS.map((option) => ({
    ...option,
    count: ratings.filter((rating) => rating.score === option.value).length,
  }));
  const max = Math.max(1, ...counts.map((item) => item.count));

  return (
    <div className="space-y-1.5" aria-label="Reparto de votos">
      {[...counts].reverse().map((item) => (
        <div key={item.value} className="flex items-center gap-2 text-xs">
          <span className="w-5 text-center" aria-hidden>{item.emoji}</span>
          <span className="w-2 font-semibold tabular-nums text-slate-500">{item.value}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full origin-left rounded-full bg-brand-500 animate-grow"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="w-4 text-right tabular-nums text-slate-500">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
