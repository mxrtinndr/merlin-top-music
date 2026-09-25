import { formatShortDate } from "@/lib/dates";
import { scorePercent } from "@/lib/scores";
import type { LeaderboardRow } from "@/lib/types";
import { MemberAvatar } from "@/components/member-avatar";
import { ScoreBadge } from "@/components/score-badge";

/** Del 4º puesto en adelante, con barra proporcional a la media. */
export function LeaderboardList({ rows, startRank }: { rows: LeaderboardRow[]; startRank: number }) {
  return (
    <ol className="space-y-2">
      {rows.map((row, index) => (
        <li
          key={row.member_id}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-surface p-3 shadow-card transition-shadow hover:shadow-lift animate-rise sm:gap-4 sm:p-4"
          style={{ animationDelay: `${0.6 + index * 0.06}s` }}
        >
          <span className="w-6 text-center font-display text-lg font-bold tabular-nums text-slate-400">
            {startRank + index}
          </span>
          <MemberAvatar member={row} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-semibold text-brand-900">
                {row.name}
                {!row.active && <span className="ml-1.5 text-xs font-normal text-slate-400">(ex-miembro)</span>}
              </p>
              <p className="shrink-0 text-xs text-slate-500">
                {row.picks_count} {row.picks_count === 1 ? "canción" : "canciones"} · {row.ratings_count} votos
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full origin-left rounded-full bg-linear-to-r from-deep-700 to-brand-400 animate-grow"
                style={{ width: `${scorePercent(row.avg_score)}%`, animationDelay: `${0.7 + index * 0.06}s` }}
              />
            </div>
            {row.last_pick_date && (
              <p className="mt-1 text-[11px] text-slate-400">Última: {formatShortDate(row.last_pick_date)}</p>
            )}
          </div>
          <ScoreBadge value={row.avg_score} />
        </li>
      ))}
    </ol>
  );
}
