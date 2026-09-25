import Link from "next/link";
import { Disc3, Star, Vote } from "lucide-react";
import { formatDayBadge, formatLongDate } from "@/lib/dates";
import { genreEmoji, genrePhrase } from "@/lib/genres";
import { formatScore } from "@/lib/scores";
import type { DailyPick } from "@/lib/types";
import type { WeekStats } from "@/lib/week-stats";
import { Eyebrow } from "@/components/ui/card";
import { SongCover } from "@/components/picks/song-cover";

const dayHref = (date: string, today: string) => (date === today ? "/" : `/?dia=${date}`);

/**
 * Resumen de la semana: la canción destacada con su portada, las cifras de
 * votos, los géneros que más han sonado y las carátulas de toda la semana.
 */
export function WeekSummary({
  stats,
  weekStart,
  today,
  weekPicks,
}: {
  stats: WeekStats;
  weekStart: string;
  today: string;
  weekPicks: DailyPick[];
}) {
  // Destacada: la mejor puntuada; si aún no hay votos, la más reciente.
  const featured = stats.topSong ?? weekPicks.at(-1) ?? null;
  const leader = stats.genres[0];

  return (
    <section
      aria-labelledby="week-summary-title"
      className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-linear-to-br from-surface via-surface to-brand-50 p-5 shadow-card sm:p-8"
    >
      {/* Halo decorativo */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand-200/40 blur-3xl" aria-hidden />

      <div className="relative">
        <Eyebrow>Desde el {formatLongDate(weekStart)}</Eyebrow>
        <h2 id="week-summary-title" className="mt-1 text-2xl font-bold text-brand-800 sm:text-3xl">
          Resumen de la semana
        </h2>

        {weekPicks.length === 0 ? (
          <p className="mt-4 text-slate-500">Aún no ha sonado nada esta semana. Cuando llegue la primera canción, aquí verás cómo va. 🎶</p>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-[auto_minmax(0,1fr)]">
            {featured && (
              <Link href={`/historico/${featured.id}`} className="group mx-auto block w-44 sm:w-52 md:mx-0">
                <SongCover
                  pick={featured}
                  size="xl"
                  className="shadow-lift transition duration-500 group-hover:-rotate-2 group-hover:scale-[1.03]"
                />
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
                  {stats.topSong ? "🏆 Top de la semana" : "Lo último"}
                </p>
                <p className="truncate font-display text-lg font-semibold text-brand-900">{featured.song_title}</p>
                <p className="truncate text-sm text-slate-500">{featured.song_artist}</p>
              </Link>
            )}

            <div className="min-w-0 space-y-6">
              <dl className="grid grid-cols-3 gap-3">
                <StatTile icon={<Disc3 className="size-4" />} label="Canciones" value={String(stats.picksCount)} />
                <StatTile icon={<Vote className="size-4" />} label="Votos" value={String(stats.ratingsCount)} />
                <StatTile
                  icon={<Star className="size-4" />}
                  label="Media"
                  value={stats.averageScore === null ? "–" : formatScore(stats.averageScore)}
                />
              </dl>

              <div>
                {leader ? (
                  <p className="font-display text-lg font-medium text-brand-900">
                    {genreEmoji(leader.genre)} Esta semana domina{" "}
                    <strong className="font-bold text-brand-600">{genrePhrase(leader.genre)}</strong> con un {leader.percent}%
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">No hemos podido identificar los géneros de esta semana.</p>
                )}
                <ul className="mt-3 space-y-2">
                  {stats.genres.slice(0, 4).map((share) => (
                    <li key={share.genre} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center" aria-hidden>{genreEmoji(share.genre)}</span>
                      <span className="w-36 truncate text-slate-600">{share.genre}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full origin-left rounded-full bg-linear-to-r from-deep-700 to-brand-400 animate-grow"
                          style={{ width: `${share.percent}%` }}
                        />
                      </div>
                      <span className="w-10 text-right tabular-nums text-slate-500">{share.percent}%</span>
                    </li>
                  ))}
                </ul>
              </div>

              {stats.mostVoted && (
                <p className="text-sm text-slate-600">
                  🗳️ La más votada: <strong className="font-semibold text-brand-900">{stats.mostVoted.song_title}</strong> de{" "}
                  {stats.mostVoted.song_artist} ({stats.mostVoted.ratings_count} votos)
                </p>
              )}
            </div>
          </div>
        )}

        {weekPicks.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Lo que ha sonado</p>
            <ul className="flex gap-4 overflow-x-auto pb-2">
              {weekPicks.map((pick) => {
                const { weekday, day } = formatDayBadge(pick.date);
                return (
                  <li key={pick.id} className="w-24 shrink-0">
                    <Link href={dayHref(pick.date, today)} scroll={false} className="group block">
                      <SongCover
                        pick={pick}
                        size="md"
                        className="transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lift"
                      />
                      <p className="mt-1.5 truncate text-xs font-semibold text-brand-900">{pick.song_title}</p>
                      <p className="text-[11px] capitalize text-slate-500">
                        {pick.date === today ? "Hoy" : `${weekday} ${day}`}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-surface/80 px-3 py-3 transition duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <span className="text-brand-500">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-brand-800">{value}</dd>
    </div>
  );
}
