import { Quote } from "lucide-react";
import { formatLongDate } from "@/lib/dates";
import type { DailyPick, Member } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { MemberAvatar } from "@/components/member-avatar";
import { ScoreBadge } from "@/components/score-badge";
import { SongEmbed } from "./song-embed";

export function PickCard({
  pick,
  presenter,
  action,
  showDate = false,
}: {
  pick: DailyPick;
  presenter: Member | undefined;
  action?: React.ReactNode;
  showDate?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      {/* Franja de marca */}
      <div className="h-1.5 bg-linear-to-r from-brand-800 via-brand-600 to-brand-400" />
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MemberAvatar member={presenter} size="md" />
            <div className="leading-tight">
              <p className="text-xs text-slate-500">{showDate ? formatLongDate(pick.date) : "Recomendada por"}</p>
              <p className="font-semibold text-brand-900">{presenter?.name ?? "Alguien"}</p>
            </div>
          </div>
          {action}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold leading-tight text-brand-800 sm:text-3xl">{pick.song_title}</h2>
            <p className="mt-1 text-lg text-slate-600">{pick.song_artist}</p>
          </div>
          {pick.ratings_count > 0 && <ScoreBadge value={pick.avg_score} size="lg" showMax className="shrink-0" />}
        </div>

        <SongEmbed url={pick.song_url} title={pick.song_title} />

        {pick.presenter_comment && (
          <figure className="relative rounded-2xl bg-brand-50/70 px-5 py-4">
            <Quote className="absolute -top-2.5 left-4 size-5 fill-brand-200 text-brand-300" aria-hidden />
            <blockquote className="whitespace-pre-line text-[15px] leading-relaxed text-brand-900">
              {pick.presenter_comment}
            </blockquote>
          </figure>
        )}
      </div>
    </Card>
  );
}
