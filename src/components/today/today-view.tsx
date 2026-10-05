"use client";

import { useState } from "react";
import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { formatLongDate, isWorkday, nextWorkdayISO, relativeDayLabel } from "@/lib/dates";
import type { DailyPick, Holiday, Member, Rating } from "@/lib/types";
import { useRefreshOnFocus } from "@/lib/use-refresh-on-focus";
import { Card, Eyebrow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { useIdentity } from "@/components/identity/identity-provider";
import { PickDetail } from "@/components/picks/pick-detail";
import { PickForm } from "@/components/picks/pick-form";
import type { WeekStats } from "@/lib/week-stats";
import { TurnTiles } from "./turn-tiles";
import { WeekNav } from "./week-nav";
import { WeekSummary } from "./week-summary";

export function TodayView({
  today,
  weekStart,
  selectedDate,
  pick,
  todayPick,
  ratings,
  previousPick,
  weekPicks,
  holidays,
  stats,
}: {
  today: string;
  weekStart: string;
  /** Día que se está viendo (hoy u otro de esta semana). */
  selectedDate: string;
  /** Canción del día seleccionado. */
  pick: DailyPick | null;
  todayPick: DailyPick | null;
  ratings: Rating[];
  previousPick: DailyPick | null;
  weekPicks: DailyPick[];
  /** Festivos de esta semana en adelante. */
  holidays: Holiday[];
  stats: WeekStats;
}) {
  useRefreshOnFocus();
  const { currentMember, memberById } = useIdentity();

  // Sin canción aún: presenta quien nominó la última canción (si sigue activo).
  const nominated = memberById(previousPick?.next_presenter_id);
  const presenter = todayPick ? memberById(todayPick.presenter_id) : nominated?.active ? nominated : undefined;
  const next = todayPick ? memberById(todayPick.next_presenter_id) : undefined;
  const viewingToday = selectedDate === today;
  // Solo se presenta en días laborables: el finde o un festivo, quien está nominada presenta el siguiente.
  const holidayDates = holidays.map((holiday) => holiday.date);
  const workday = isWorkday(today, holidayDates);
  const nextWorkday = nextWorkdayISO(today, holidayDates);
  const presenterDay = todayPick || workday ? "hoy" : relativeDayLabel(nextWorkday, today);
  const nextDay = relativeDayLabel(nextWorkday, today);
  const todayHoliday = holidays.find((holiday) => holiday.date === today);
  // Festivos entre hoy y el siguiente turno: explican por qué el turno se salta días.
  const skipped = holidays.filter((holiday) => holiday.date > today && holiday.date < nextWorkday);

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <Eyebrow className="first-letter:uppercase">{formatLongDate(today)}</Eyebrow>
        <h1 className="mt-1 text-3xl font-bold text-brand-800 sm:text-4xl">
          {currentMember ? (
            <>
              ¡Hola, <span className="text-brand-500">{currentMember.name}</span>!
            </>
          ) : (
            "La canción del día"
          )}
        </h1>
      </div>

      <TurnTiles
        presenter={presenter}
        next={next}
        presenterDay={presenterDay}
        nextDay={nextDay}
        currentMemberId={currentMember?.id}
      />

      {skipped.length > 0 && <HolidayNotice holidays={skipped} today={today} nextDay={nextDay} />}

      <section className="space-y-3" aria-label="Canciones de esta semana">
        <WeekNav today={today} weekStart={weekStart} selectedDate={selectedDate} weekPicks={weekPicks} holidays={holidays} />
        {selectedDate < weekStart && (
          <p className="flex flex-wrap items-center gap-x-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand-900">
            Estás viendo la canción del <strong className="font-semibold">{formatLongDate(selectedDate)}</strong>.
            <Link href="/" className="font-semibold text-brand-600 underline underline-offset-4 hover:text-brand-700">
              Volver a hoy
            </Link>
          </p>
        )}
        {pick ? (
          <PickDetail key={pick.id} pick={pick} ratings={ratings} editable={viewingToday} showDate={!viewingToday} />
        ) : (
          <NoPickYet today={today} presenter={presenter} workday={workday} holiday={todayHoliday} backDay={presenterDay} />
        )}
      </section>

      <WeekSummary stats={stats} weekStart={weekStart} today={today} weekPicks={weekPicks} />
    </div>
  );
}

function NoPickYet({
  today,
  presenter,
  workday,
  holiday,
  backDay,
}: {
  today: string;
  presenter: Member | undefined;
  workday: boolean;
  /** El festivo de hoy, si lo es. */
  holiday: Holiday | undefined;
  /** Cuándo vuelve la canción si hoy no hay ("el lunes", "mañana"…). */
  backDay: string;
}) {
  const { currentMember, ready, openPicker } = useIdentity();
  const [takingOver, setTakingOver] = useState(false);

  if (!ready) return <Card className="h-72 animate-pulse bg-surface/60" aria-busy="true" />;

  if (!workday) {
    const isMe = !!currentMember && presenter?.id === currentMember.id;
    return <DayOff holiday={holiday} backDay={backDay} presenter={presenter} isMe={isMe} />;
  }

  const isMyTurn = currentMember !== null && (presenter?.id === currentMember.id || !presenter || takingOver);

  if (currentMember && isMyTurn) {
    const heading = presenter?.id === currentMember.id
      ? "¡Hoy presentas tú! 🎤"
      : presenter
        ? `Tomas el relevo de ${presenter.name}`
        : "¡Estrena la tradición! 🎉";
    return (
      <Card className="overflow-hidden animate-rise">
        <div className="h-1.5 bg-linear-to-r from-deep-800 via-deep-600 to-brand-400" />
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <MemberAvatar member={currentMember} size="md" />
            <div>
              <h2 className="text-xl font-semibold text-brand-800">{heading}</h2>
              <p className="text-sm text-slate-500">Comparte tu canción y nomina a quien presentará después.</p>
            </div>
          </div>
          <PickForm mode="create" date={today} presenter={currentMember} />
          {takingOver && (
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setTakingOver(false)}>
              Mejor no, que presente {presenter?.name}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="px-6 py-12 text-center animate-rise">
      <Equalizer />
      {presenter ? (
        <>
          <h2 className="mt-6 text-xl font-semibold text-brand-800">{presenter.name} está preparando la canción</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Aún no la ha publicado. Vuelve en un rato con el café en la mano ☕
          </p>
        </>
      ) : (
        <>
          <h2 className="mt-6 text-xl font-semibold text-brand-800">Nadie tiene turno todavía</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Elige tu nombre y estrena la tradición con la primera canción.
          </p>
        </>
      )}
      <div className="mt-6">
        {!currentMember ? (
          <Button onClick={openPicker}>Elegir mi nombre</Button>
        ) : (
          presenter && (
            <Button variant="secondary" onClick={() => setTakingOver(true)}>
              ¿{presenter.name} no está hoy? Presento yo
            </Button>
          )
        )}
      </div>
    </Card>
  );
}

/** Hoy no hay canción: fin de semana o festivo. */
function DayOff({
  holiday,
  backDay,
  presenter,
  isMe,
}: {
  holiday: Holiday | undefined;
  backDay: string;
  presenter: Member | undefined;
  isMe: boolean;
}) {
  const turn = isMe
    ? "Te toca a ti: ve pensando qué vas a poner 🎶"
    : presenter
      ? `Presenta ${presenter.name}.`
      : "Quien llegue primero estrena el turno.";

  if (!holiday) {
    return (
      <Card className="px-6 py-12 text-center animate-rise">
        <p className="text-5xl" aria-hidden>
          🌴
        </p>
        <h2 className="mt-4 text-xl font-semibold text-brand-800">Es fin de semana</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          La canción del día vuelve {backDay}. {turn}
        </p>
      </Card>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-surface to-rose-50 px-6 py-12 text-center shadow-card animate-rise">
      <Confetti />
      <div className="relative">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-rose-500 text-white shadow-lift animate-float">
          <PartyPopper className="size-8" aria-hidden />
        </span>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Hoy es festivo</p>
        <h2 className="mt-1 text-2xl font-bold text-brand-800">{holiday.name ?? "Día sin canción"}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Hoy descansa la música. La canción del día vuelve {backDay}. {turn}
        </p>
      </div>
    </section>
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Aviso bajo los turnos: el siguiente turno se salta uno o varios festivos. */
function HolidayNotice({ holidays, today, nextDay }: { holidays: Holiday[]; today: string; nextDay: string }) {
  const days = new Intl.ListFormat("es", { type: "conjunction" }).format(
    holidays.map((holiday) => {
      const day = relativeDayLabel(holiday.date, today);
      return holiday.name ? `${day} (${holiday.name})` : day;
    }),
  );
  return (
    <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-linear-to-r from-amber-50 to-rose-50 px-4 py-2.5 text-sm text-slate-600 animate-rise">
      <PartyPopper className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
      <span>
        {capitalize(days)} {holidays.length > 1 ? "son festivos" : "es festivo"}: el siguiente turno pasa a{" "}
        <strong className="font-semibold text-brand-900">{nextDay}</strong>.
      </span>
    </p>
  );
}

/** Confeti decorativo para los festivos. */
const CONFETTI = [
  { left: "8%", top: "18%", className: "bg-amber-400 rotate-12" },
  { left: "20%", top: "72%", className: "bg-rose-400 -rotate-12" },
  { left: "84%", top: "22%", className: "bg-brand-400 rotate-45" },
  { left: "90%", top: "64%", className: "bg-amber-300 -rotate-6" },
  { left: "72%", top: "84%", className: "bg-rose-300 rotate-12" },
  { left: "30%", top: "12%", className: "bg-brand-300 -rotate-45" },
];

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {CONFETTI.map((piece, index) => (
        <span
          key={index}
          className={`absolute h-3 w-1.5 rounded-full opacity-70 ${piece.className}`}
          style={{ left: piece.left, top: piece.top }}
        />
      ))}
    </div>
  );
}

function Equalizer() {
  return (
    <div className="mx-auto flex h-12 items-end justify-center gap-1.5" aria-hidden>
      {[0, 0.3, 0.15, 0.45, 0.25].map((delay, index) => (
        <span
          key={index}
          className="h-full w-2 origin-bottom rounded-full bg-linear-to-t from-deep-700 to-brand-400 animate-eq"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
