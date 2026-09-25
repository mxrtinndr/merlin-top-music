import { Quote } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatLongDate } from "@/lib/dates";
import type { DailyPick, Member } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { MemberAvatar } from "@/components/member-avatar";
import { ScoreBadge } from "@/components/score-badge";
import { SongCover } from "./song-cover";
import { SongEmbed, SongLinks } from "./song-embed";

export function PickCard({
  pick,
  presenter,
  action,
  showDate = false,
  className,
}: {
  pick: DailyPick;
  presenter: Member | undefined;
  action?: React.ReactNode;
  showDate?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      {/* Franja de marca */}
      <div className="h-1.5 shrink-0 bg-linear-to-r from-deep-800 via-deep-600 to-brand-400" />
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <MemberAvatar member={presenter} size="md" />
            <div className="min-w-0 leading-tight">
              <p className="text-xs text-slate-500">{showDate ? formatLongDate(pick.date) : "Recomendada por"}</p>
              <p className="truncate font-semibold text-brand-900">{presenter?.name ?? "Alguien"}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {action}
            {pick.ratings_count > 0 && <ScoreBadge value={pick.avg_score} size="lg" showMax />}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SongCover pick={pick} size="lg" className="transition duration-500 hover:-rotate-2 hover:scale-105" />
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-bold leading-tight text-brand-800 sm:text-3xl">{pick.song_title}</h2>
            <p className="mt-1 text-lg text-slate-600">{pick.song_artist}</p>
          </div>
        </div>

        <div className="space-y-3">
          <SongEmbed url={pick.song_url} title={pick.song_title} />
          <SongLinks pick={pick} />
        </div>

        {pick.presenter_comment && (
          <figure className="relative rounded-xl bg-brand-50/70 px-5 py-4">
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
