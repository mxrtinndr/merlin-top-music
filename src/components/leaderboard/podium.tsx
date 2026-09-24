import { cn } from "@/lib/cn";
import { formatScore } from "@/lib/scores";
import type { LeaderboardRow } from "@/lib/types";
import { MemberAvatar } from "@/components/member-avatar";

const PLACES = {
  1: {
    medal: "🥇",
    pedestal: "h-36 sm:h-40 bg-linear-to-b from-amber-300 via-amber-400 to-amber-500 text-amber-900",
    glow: "shadow-amber-400/40",
    delay: "0.35s",
  },
  2: {
    medal: "🥈",
    pedestal: "h-28 sm:h-32 bg-linear-to-b from-slate-200 via-slate-300 to-slate-400 text-slate-700",
    glow: "shadow-slate-400/40",
    delay: "0.15s",
  },
  3: {
    medal: "🥉",
    pedestal: "h-20 sm:h-24 bg-linear-to-b from-orange-200 via-orange-300 to-orange-400 text-orange-900",
    glow: "shadow-orange-400/40",
    delay: "0.5s",
  },
} as const;

type Place = keyof typeof PLACES;

/** Top 3 en formato podio: 2º · 1º · 3º */
export function Podium({ rows }: { rows: LeaderboardRow[] }) {
  const [first, second, third] = rows;
  const slots: Array<[Place, LeaderboardRow | undefined]> = [
    [2, second],
    [1, first],
    [3, third],
  ];

  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4" role="list" aria-label="Podio">
      {slots.map(([place, row]) =>
        row ? <PodiumColumn key={place} place={place} row={row} /> : <div key={place} aria-hidden />,
      )}
    </div>
  );
}

function PodiumColumn({ place, row }: { place: Place; row: LeaderboardRow }) {
  const style = PLACES[place];
  const isFirst = place === 1;

  return (
    <div role="listitem" className="group flex flex-col items-center animate-rise" style={{ animationDelay: style.delay }}>
      <div className="relative mb-2">
        {isFirst && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-2xl animate-float" aria-hidden>
            👑
          </span>
        )}
        <MemberAvatar
          member={row}
          size={isFirst ? "xl" : "lg"}
          className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
        />
        <span
          className="absolute -bottom-1 -right-1 text-xl drop-shadow-sm transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125"
          aria-hidden
        >
          {style.medal}
        </span>
      </div>

      <p className={cn("max-w-full truncate px-1 text-center font-semibold text-brand-900", isFirst ? "text-base" : "text-sm")}>
        {row.name}
      </p>
      <p className={cn("font-display font-bold tabular-nums text-brand-700", isFirst ? "text-3xl" : "text-2xl")}>
        {formatScore(row.avg_score)}
      </p>
      <p className="mb-3 text-center text-[11px] leading-tight text-slate-500">
        {row.picks_count} {row.picks_count === 1 ? "canción" : "canciones"} · {row.ratings_count} votos
      </p>

      <div
        className={cn(
          "flex w-full items-start justify-center rounded-t-2xl pt-3 shadow-lg",
          style.pedestal,
          style.glow,
        )}
      >
        <span className="font-display text-3xl font-bold opacity-80 sm:text-4xl">{place}</span>
      </div>
    </div>
  );
}
