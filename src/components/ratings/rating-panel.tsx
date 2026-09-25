"use client";

import { useState } from "react";
import { EyeOff, X } from "lucide-react";
import { formatScore, MAX_SCORE, scoreOption } from "@/lib/scores";
import type { DailyPick, Rating } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MemberAvatar } from "@/components/member-avatar";
import { useIdentity } from "@/components/identity/identity-provider";
import { RatingForm } from "./rating-form";
import { RatingList, ScoreDistribution } from "./rating-list";

/**
 * Dos tarjetas: "Votación" (puntuar, media y reparto) y "Comentarios" (qué ha
 * votado y opinado cada persona). Las notas del resto se ocultan hasta que
 * votas, para no condicionar a nadie (la persona presentadora las ve siempre).
 */
export function RatingPanel({ pick, ratings }: { pick: DailyPick; ratings: Rating[] }) {
  const { currentMember, ready, openPicker, memberById } = useIdentity();
  // Nota por la que se filtran los comentarios (al pulsar una barra del reparto).
  const [scoreFilter, setScoreFilter] = useState<number | null>(null);
  const [detail, setDetail] = useState<"voters" | "breakdown" | null>(null);

  if (!ready) {
    return (
      <>
        <Card className="min-h-64 animate-pulse bg-surface/60" aria-busy="true" />
        <Card className="min-h-64 animate-pulse bg-surface/60" aria-busy="true" />
      </>
    );
  }

  const myRating = currentMember ? ratings.find((rating) => rating.member_id === currentMember.id) : undefined;
  const isPresenter = currentMember?.id === pick.presenter_id;
  const revealed = Boolean(myRating || isPresenter);
  const comments = ratings.filter((rating) => rating.comment);
  const filtered = scoreFilter === null ? ratings : ratings.filter((rating) => rating.score === scoreFilter);
  const votesLabel = `${pick.ratings_count} ${pick.ratings_count === 1 ? "voto" : "votos"}`;
  const canInspect = revealed && ratings.length > 0;

  return (
    <>
      <Card className="flex flex-col p-5 sm:p-6">
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

        <div className="mt-6 border-t border-slate-100 pt-5">
          <CardHeader
            title="Votación"
            subtitle={
              canInspect ? (
                <button
                  type="button"
                  onClick={() => setDetail("voters")}
                  className="font-medium text-brand-600 underline decoration-dotted underline-offset-4 transition hover:text-brand-700"
                >
                  {votesLabel}
                </button>
              ) : (
                votesLabel
              )
            }
            action={
              canInspect ? (
                <button
                  type="button"
                  onClick={() => setDetail("breakdown")}
                  title="Ver qué nota puso cada persona"
                  className="rounded-lg px-2 py-1 text-right transition-all duration-200 hover:-translate-y-px hover:bg-brand-50"
                >
                  <span className="block font-display text-2xl font-bold leading-none text-brand-700">{formatScore(pick.avg_score)}</span>
                  <span className="text-[11px] text-slate-500 underline decoration-dotted underline-offset-2">media</span>
                </button>
              ) : null
            }
          />
          <div className="mt-4">
            {revealed ? (
              ratings.length > 0 ? (
                <ScoreDistribution ratings={ratings} selected={scoreFilter} onSelect={setScoreFilter} />
              ) : (
                <p className="text-sm text-slate-500">Todavía no ha votado nadie.</p>
              )
            ) : (
              <HiddenVotes />
            )}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col p-5 sm:p-6">
        <CardHeader
          title="Comentarios"
          subtitle={
            revealed
              ? `${ratings.length} ${ratings.length === 1 ? "voto" : "votos"} · ${comments.length} con comentario`
              : "Se ven al votar"
          }
          className="mb-3"
        />
        {revealed && scoreFilter !== null && (
          <button
            type="button"
            onClick={() => setScoreFilter(null)}
            className="mb-2 inline-flex items-center gap-1.5 self-start rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            Solo notas de {scoreFilter} <X className="size-3.5" aria-label="Quitar filtro" />
          </button>
        )}
        {revealed ? (
          <RatingList
            ratings={filtered}
            highlightId={currentMember?.id}
            emptyMessage={scoreFilter === null ? undefined : `Nadie ha puesto un ${scoreFilter}.`}
          />
        ) : (
          <div>
            <HiddenVotes />
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

      {canInspect && (
        <Modal
          open={detail !== null}
          onClose={() => setDetail(null)}
          title={detail === "breakdown" ? "Cómo sale la media" : "Quién ha votado"}
          description={detail === "breakdown" ? "La nota que ha puesto cada persona." : votesLabel}
        >
          {detail === "breakdown" ? <ScoreBreakdown ratings={ratings} /> : <VoterList ratings={ratings} />}
        </Modal>
      )}
    </>
  );
}

function VoterList({ ratings }: { ratings: Rating[] }) {
  const { memberById } = useIdentity();
  return (
    <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
      {ratings.map((rating) => {
        const member = memberById(rating.member_id);
        return (
          <li key={rating.id} className="flex items-center gap-3 py-2.5">
            <MemberAvatar member={member} size="sm" />
            <span className="font-medium text-brand-900">{member?.name ?? "Alguien"}</span>
          </li>
        );
      })}
    </ul>
  );
}

function ScoreBreakdown({ ratings }: { ratings: Rating[] }) {
  const { memberById } = useIdentity();
  const total = ratings.reduce((sum, rating) => sum + rating.score, 0);
  const sorted = [...ratings].sort((a, b) => b.score - a.score);
  return (
    <div>
      <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto">
        {sorted.map((rating) => {
          const member = memberById(rating.member_id);
          const option = scoreOption(rating.score);
          return (
            <li key={rating.id} className="flex items-center gap-3 py-2.5">
              <MemberAvatar member={member} size="sm" />
              <span className="min-w-0 flex-1 truncate font-medium text-brand-900">{member?.name ?? "Alguien"}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-brand-800">
                {option?.emoji} {rating.score}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
        {sorted.map((rating) => rating.score).join(" + ")} = <strong>{total}</strong> ÷ {ratings.length}{" "}
        {ratings.length === 1 ? "voto" : "votos"} = <strong className="text-brand-700">{formatScore(total / ratings.length)}</strong>
      </p>
    </div>
  );
}

function HiddenVotes() {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-5 text-center">
      <EyeOff className="mx-auto size-5 text-slate-400" />
      <p className="mt-2 text-sm text-slate-600">Puntúa para ver lo que opina el resto.</p>
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
