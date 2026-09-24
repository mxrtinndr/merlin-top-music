"use client";

import { EyeOff } from "lucide-react";
import { formatScore, MAX_SCORE, scoreOption } from "@/lib/scores";
import type { DailyPick, Rating } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { useIdentity } from "@/components/identity/identity-provider";
import { RatingForm } from "./rating-form";
import { RatingList, ScoreDistribution } from "./rating-list";

/**
 * Puntuar y ver votos. Las notas del resto se ocultan hasta que votas,
 * para no condicionar a nadie (la persona presentadora las ve siempre).
 */
export function RatingPanel({ pick, ratings }: { pick: DailyPick; ratings: Rating[] }) {
  const { currentMember, ready, openPicker, memberById } = useIdentity();

  if (!ready) {
    return <Card className="h-64 animate-pulse bg-white/60" aria-busy="true" />;
  }

  const myRating = currentMember ? ratings.find((rating) => rating.member_id === currentMember.id) : undefined;
  const isPresenter = currentMember?.id === pick.presenter_id;
  const revealed = Boolean(myRating || isPresenter);

  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        {!currentMember ? (
          <div className="space-y-3 text-center">
            <p className="text-3xl">🎧</p>
            <p className="font-semibold text-brand-900">¿Quién está escuchando?</p>
            <p className="text-sm text-slate-500">Elige tu nombre para poder puntuar.</p>
            <Button onClick={openPicker} className="w-full">
              Elegir mi nombre
            </Button>
          </div>
        ) : isPresenter ? (
          <div className="space-y-1 text-center">
            <p className="text-3xl">🎙️</p>
            <p className="font-semibold text-brand-900">Es tu canción</p>
            <p className="text-sm text-slate-500">No puedes puntuarla, pero sí ver qué opina el equipo.</p>
          </div>
        ) : myRating ? (
          <MyRating rating={myRating} />
        ) : (
          <>
            <CardHeader title="¿Qué nota le pones?" subtitle={`Del 1 al ${MAX_SCORE}. Solo se puede votar una vez.`} className="mb-4" />
            <RatingForm pickId={pick.id} memberId={currentMember.id} />
          </>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Votos del equipo"
          subtitle={`${pick.ratings_count} ${pick.ratings_count === 1 ? "voto" : "votos"}`}
          action={
            revealed && pick.ratings_count > 0 ? (
              <div className="text-right">
                <p className="font-display text-2xl font-bold leading-none text-brand-700">{formatScore(pick.avg_score)}</p>
                <p className="text-[11px] text-slate-500">media</p>
              </div>
            ) : null
          }
        />
        {revealed ? (
          <div className="mt-4 space-y-4">
            {ratings.length > 0 && <ScoreDistribution ratings={ratings} />}
            <RatingList ratings={ratings} highlightId={currentMember?.id} />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-5 text-center">
            <EyeOff className="mx-auto size-5 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">Puntúa para ver lo que opina el resto.</p>
            {ratings.length > 0 && (
              <div className="mt-3 flex justify-center -space-x-2">
                {ratings.slice(0, 10).map((rating) => (
                  <MemberAvatar key={rating.id} member={memberById(rating.member_id)} size="sm" />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function MyRating({ rating }: { rating: Rating }) {
  const option = scoreOption(rating.score);
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-500 text-white shadow-md shadow-brand-500/30 animate-pop">
        <span className="text-xl leading-none">{option?.emoji}</span>
        <span className="font-display text-xl font-bold leading-tight">{rating.score}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Tu puntuación</p>
        <p className="font-semibold text-brand-900">{option?.label}</p>
        {rating.comment && <p className="mt-0.5 text-sm text-slate-600">“{rating.comment}”</p>}
      </div>
    </div>
  );
}
