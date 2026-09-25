import Link from "next/link";
import { ChevronRight, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDayBadge, formatShortDate } from "@/lib/dates";
import type { DailyPick, Member } from "@/lib/types";
import { MemberChip } from "@/components/member-avatar";
import { ScoreBadge } from "@/components/score-badge";
import { SongCover } from "./song-cover";

export function PickListItem({
  pick,
  presenter,
  rank,
  rankEmoji,
  href = `/historico/${pick.id}`,
}: {
  pick: DailyPick;
  presenter: Member | undefined;
  /** Posición cuando la lista es un ranking (Hall of Fame / vergüenza). */
  rank?: number;
  rankEmoji?: string;
  /** Adónde lleva al pulsarla (por defecto, su detalle en el histórico). */
  href?: string;
}) {
  const day = formatDayBadge(pick.date);

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-surface p-3 shadow-card transition hover:border-brand-200 hover:shadow-lift sm:gap-4 sm:p-4"
    >
      {rank !== undefined ? (
        <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <span className="text-base leading-none">{rankEmoji}</span>
          <span className="font-display text-sm font-bold">#{rank}</span>
        </span>
      ) : (
        <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <span className="text-[10px] font-semibold uppercase leading-none tracking-wide">{day.weekday}</span>
          <span className="font-display text-lg font-bold leading-tight">{day.day}</span>
        </span>
      )}

      <SongCover pick={pick} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-brand-900">{pick.song_title}</p>
        <p className="truncate text-sm text-slate-500">{pick.song_artist}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <MemberChip member={presenter} className="text-xs" />
          {rank !== undefined && <span className="text-xs text-slate-400">{formatShortDate(pick.date)}</span>}
          {pick.presenter_comment && (
            <MessageSquareText className="size-3.5 text-slate-300" aria-label="Con comentario" />
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <ScoreBadge value={pick.avg_score} />
        <span className={cn("text-[11px] text-slate-400", pick.ratings_count === 0 && "italic")}>
          {pick.ratings_count === 0 ? "sin votos" : `${pick.ratings_count} votos`}
        </span>
      </div>
      <ChevronRight className="hidden size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 sm:block" />
    </Link>
  );
}
