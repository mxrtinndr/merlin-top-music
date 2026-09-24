"use client";

import { useState } from "react";
import { formatLongDate } from "@/lib/dates";
import type { DailyPick, Member, Rating } from "@/lib/types";
import { useRefreshOnFocus } from "@/lib/use-refresh-on-focus";
import { Card, Eyebrow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { useIdentity } from "@/components/identity/identity-provider";
import { PickDetail } from "@/components/picks/pick-detail";
import { PickForm } from "@/components/picks/pick-form";
import { TurnTiles } from "./turn-tiles";

export function TodayView({
  today,
  pick,
  ratings,
  previousPick,
}: {
  today: string;
  pick: DailyPick | null;
  ratings: Rating[];
  previousPick: DailyPick | null;
}) {
  useRefreshOnFocus();
  const { currentMember, memberById } = useIdentity();

  // Sin canción aún: presenta quien nominó la última canción (si sigue activo).
  const nominated = memberById(previousPick?.next_presenter_id);
  const presenter = pick ? memberById(pick.presenter_id) : nominated?.active ? nominated : undefined;
  const next = pick ? memberById(pick.next_presenter_id) : undefined;

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <Eyebrow className="first-letter:uppercase">{formatLongDate(today)}</Eyebrow>
        <h1 className="mt-1 text-3xl font-bold text-brand-800 sm:text-4xl">
          {currentMember ? `¡Hola, ${currentMember.name}!` : "La canción del día"}
        </h1>
      </div>

      <TurnTiles presenter={presenter} next={next} currentMemberId={currentMember?.id} />

      {pick ? (
        <PickDetail pick={pick} ratings={ratings} editable />
      ) : (
        <NoPickYet today={today} presenter={presenter} />
      )}
    </div>
  );
}

function NoPickYet({ today, presenter }: { today: string; presenter: Member | undefined }) {
  const { currentMember, ready, openPicker } = useIdentity();
  const [takingOver, setTakingOver] = useState(false);

  if (!ready) return <Card className="h-72 animate-pulse bg-white/60" aria-busy="true" />;

  const isMyTurn = currentMember !== null && (presenter?.id === currentMember.id || !presenter || takingOver);

  if (currentMember && isMyTurn) {
    const heading = presenter?.id === currentMember.id
      ? "¡Hoy presentas tú! 🎤"
      : presenter
        ? `Tomas el relevo de ${presenter.name}`
        : "¡Estrena la tradición! 🎉";
    return (
      <Card className="overflow-hidden animate-rise">
        <div className="h-1.5 bg-linear-to-r from-brand-800 via-brand-600 to-brand-400" />
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
          className="h-full w-2 origin-bottom rounded-full bg-linear-to-t from-brand-700 to-brand-400 animate-eq"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
