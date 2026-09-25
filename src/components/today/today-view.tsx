"use client";

import { useState } from "react";
import Link from "next/link";
import { formatLongDate } from "@/lib/dates";
import type { DailyPick, Member, Rating } from "@/lib/types";
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
  stats: WeekStats;
}) {
  useRefreshOnFocus();
  const { currentMember, memberById } = useIdentity();

  // Sin canción aún: presenta quien nominó la última canción (si sigue activo).
  const nominated = memberById(previousPick?.next_presenter_id);
  const presenter = todayPick ? memberById(todayPick.presenter_id) : nominated?.active ? nominated : undefined;
  const next = todayPick ? memberById(todayPick.next_presenter_id) : undefined;
  const viewingToday = selectedDate === today;

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

      <TurnTiles presenter={presenter} next={next} currentMemberId={currentMember?.id} />

      <section className="space-y-3" aria-label="Canciones de esta semana">
        <WeekNav today={today} weekStart={weekStart} selectedDate={selectedDate} weekPicks={weekPicks} />
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
          <NoPickYet today={today} presenter={presenter} />
        )}
      </section>

      <WeekSummary stats={stats} weekStart={weekStart} today={today} weekPicks={weekPicks} />
    </div>
  );
}

function NoPickYet({ today, presenter }: { today: string; presenter: Member | undefined }) {
  const { currentMember, ready, openPicker } = useIdentity();
  const [takingOver, setTakingOver] = useState(false);

  if (!ready) return <Card className="h-72 animate-pulse bg-surface/60" aria-busy="true" />;

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
