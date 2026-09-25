import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  addDaysISO,
  addMonthsISO,
  daysInMonth,
  formatLongDate,
  formatMonth,
  startOfMonthISO,
  todayISO,
  weekdayIndex,
} from "@/lib/dates";
import { getMembers, getPicksBetween } from "@/lib/queries";
import type { DailyPick, Member } from "@/lib/types";
import { Card, Eyebrow } from "@/components/ui/card";
import { MemberAvatar, MemberChip } from "@/components/member-avatar";
import { ScoreBadge } from "@/components/score-badge";
import { SongCover } from "@/components/picks/song-cover";

export const metadata: Metadata = { title: "Calendario" };

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** ?mes=AAAA-MM → primer día de ese mes; cualquier otra cosa (o un mes futuro) → el actual. */
function parseMonth(value: string | string[] | undefined, currentMonth: string): string {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return currentMonth;
  const month = `${value}-01`;
  return month <= currentMonth ? month : currentMonth;
}

const monthHref = (month: string, currentMonth: string) =>
  month === currentMonth ? "/calendario" : `/calendario?mes=${month.slice(0, 7)}`;

const songHref = (pick: DailyPick) => `/?cancion=${pick.id}`;

export default async function CalendarPage({ searchParams }: PageProps<"/calendario">) {
  await connection();
  const today = todayISO();
  const currentMonth = startOfMonthISO(today);
  const month = parseMonth((await searchParams).mes, currentMonth);
  const lastDay = addDaysISO(month, daysInMonth(month) - 1);

  const [picks, members] = await Promise.all([getPicksBetween(month, lastDay), getMembers()]);
  const memberById = new Map(members.map((member) => [member.id, member]));
  const byDate = new Map(picks.map((pick) => [pick.date, pick]));
  const days = Array.from({ length: daysInMonth(month) }, (_, index) => addDaysISO(month, index));
  const previous = addMonthsISO(month, -1);
  const next = addMonthsISO(month, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Calendario</Eyebrow>
          <h1 className="mt-1 text-3xl font-bold text-brand-800 sm:text-4xl">Canciones del mes</h1>
          <p className="mt-1 text-sm text-slate-500">Pulsa un día para escuchar su canción y ver sus comentarios.</p>
        </div>

        <nav className="flex items-center gap-2" aria-label="Cambiar de mes">
          <Link
            href={monthHref(previous, currentMonth)}
            aria-label="Mes anterior"
            className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-surface text-brand-600 shadow-sm transition hover:-translate-y-px hover:bg-brand-50"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <p className="min-w-40 text-center font-display text-lg font-semibold capitalize text-brand-800">{formatMonth(month)}</p>
          {next <= currentMonth ? (
            <Link
              href={monthHref(next, currentMonth)}
              aria-label="Mes siguiente"
              className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-surface text-brand-600 shadow-sm transition hover:-translate-y-px hover:bg-brand-50"
            >
              <ChevronRight className="size-5" />
            </Link>
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-300" aria-hidden>
              <ChevronRight className="size-5" />
            </span>
          )}
        </nav>
      </div>

      <Card className="p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:gap-2">
          {WEEKDAYS.map((day) => (
            <span key={day}>
              <span className="sm:hidden">{day[0]}</span>
              <span className="hidden sm:inline">{day}</span>
            </span>
          ))}
        </div>

        <ol className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: weekdayIndex(month) }, (_, index) => (
            <li key={`blank-${index}`} aria-hidden />
          ))}
          {days.map((date) => {
            const pick = byDate.get(date);
            return (
              <li key={date}>
                {pick ? (
                  <DayWithSong pick={pick} presenter={memberById.get(pick.presenter_id)} isToday={date === today} />
                ) : (
                  <EmptyDay date={date} today={today} />
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      {picks.length === 0 ? (
        <Card className="px-6 py-10 text-center">
          <p className="text-3xl">📅</p>
          <p className="mt-2 font-semibold text-brand-800">Este mes no sonó ninguna canción</p>
        </Card>
      ) : (
        // En móvil las casillas son pequeñas: debajo va el detalle de cada día.
        <ul className="space-y-2 md:hidden">
          {picks.map((pick) => (
            <li key={pick.id}>
              <Link
                href={songHref(pick)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-surface p-3 shadow-card transition hover:shadow-lift"
              >
                <SongCover pick={pick} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{formatLongDate(pick.date)}</p>
                  <p className="truncate font-semibold text-brand-900">{pick.song_title}</p>
                  <MemberChip member={memberById.get(pick.presenter_id)} className="text-xs" />
                </div>
                <ScoreBadge value={pick.avg_score} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyDay({ date, today }: { date: string; today: string }) {
  return (
    <div
      className={cn(
        "flex aspect-square items-start rounded-lg border border-slate-100 p-1 text-xs tabular-nums sm:p-2 sm:text-sm md:aspect-auto md:h-full md:min-h-32",
        date > today ? "text-slate-300" : "text-slate-400",
        date === today && "border-brand-300 font-bold text-brand-600",
      )}
    >
      {Number(date.slice(8))}
    </div>
  );
}

/**
 * Casilla con canción: carátula con el día y la valoración final encima, y
 * debajo (desde md) el título y quién la puso.
 */
function DayWithSong({ pick, presenter, isToday }: { pick: DailyPick; presenter: Member | undefined; isToday: boolean }) {
  const who = presenter?.name ?? "alguien";
  return (
    <Link
      href={songHref(pick)}
      title={`${pick.song_title} · ${pick.song_artist}\nLa puso ${who}`}
      aria-label={`Día ${Number(pick.date.slice(8))}: ${pick.song_title} de ${pick.song_artist}, la puso ${who}`}
      className={cn(
        "group block rounded-lg transition duration-200 hover:-translate-y-0.5",
        isToday && "ring-2 ring-brand-500 ring-offset-2 ring-offset-surface",
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg shadow-sm transition group-hover:shadow-lift">
        <SongCover pick={pick} size="fill" />
        {/* Degradado para que el número se lea sobre cualquier carátula */}
        <span className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-transparent" aria-hidden />
        <span className="absolute left-1 top-0.5 text-xs font-bold text-white drop-shadow sm:left-2 sm:top-1.5 sm:text-sm">
          {Number(pick.date.slice(8))}
        </span>
        {pick.ratings_count > 0 && (
          <ScoreBadge value={pick.avg_score} size="sm" className="absolute right-1.5 top-1.5 hidden shadow-sm md:inline-flex" />
        )}
        <MemberAvatar member={presenter} size="xs" className="absolute bottom-0.5 right-0.5 md:hidden" />
      </div>
      <div className="mt-1.5 hidden min-w-0 md:block">
        <p className="truncate text-xs font-semibold text-brand-900">{pick.song_title}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <MemberAvatar member={presenter} size="xs" />
          <span className="truncate text-[11px] text-slate-500">{who}</span>
        </div>
      </div>
    </Link>
  );
}
