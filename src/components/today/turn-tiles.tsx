"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Member } from "@/lib/types";
import { MemberAvatar } from "@/components/member-avatar";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Las dos baldosas de la portada: quién presenta y quién va después.
 * presenterDay / nextDay: cuándo le toca a cada una ("hoy", "mañana", "el lunes").
 */
export function TurnTiles({
  presenter,
  next,
  presenterDay,
  nextDay,
  currentMemberId,
}: {
  presenter: Member | undefined;
  next: Member | undefined;
  presenterDay: string;
  nextDay: string;
  currentMemberId: string | undefined;
}) {
  const presenterIsMe = presenter !== undefined && presenter.id === currentMemberId;
  const nextIsMe = next !== undefined && next.id === currentMemberId;

  // En móvil van lado a lado como baldosas verticales (avatar y día arriba, texto debajo);
  // desde sm, en fila con el avatar a la izquierda.
  return (
    <div className="mt-2 grid grid-cols-2 gap-3 sm:mt-4">
      <div className={cn(TILE, "border border-slate-200/60 bg-surface shadow-card hover:shadow-lift")}>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          <MemberAvatar member={presenter} size="md" />
          <DayChip day={presenterDay} className="bg-brand-50 text-brand-700" />
        </div>
        <div className="min-w-0 max-w-full">
          <p className={cn(LABEL, "text-slate-500")}>
            <span className="sm:hidden">Presenta</span>
            <span className="hidden sm:inline">{capitalize(presenterDay)} presenta</span>
          </p>
          <p className={cn(NAME, "text-brand-900")}>
            {presenter?.name ?? "Por decidir"}
            {presenterIsMe && <span className="text-brand-500"> (tú)</span>}
          </p>
          {presenterIsMe && !next && (
            <p className={cn(NOTE, "font-semibold text-brand-500")}>
              ¡{capitalize(presenterDay)} es tu turno de recomendar una canción! 🎤
            </p>
          )}
        </div>
      </div>

      <div className={cn(TILE, "relative overflow-hidden bg-linear-to-br from-deep-800 via-deep-700 to-brand-500 text-white shadow-lift")}>
        {/* Brillo decorativo */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative flex w-full items-center justify-between gap-2 sm:w-auto">
          {next ? (
            <MemberAvatar member={next} size="md" className="ring-white/30" />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
              <ArrowRight className="size-5" />
            </span>
          )}
          {next && <DayChip day={nextDay} className="bg-white/15 text-white" />}
        </div>
        <div className="relative min-w-0 max-w-full">
          <p className={cn(LABEL, "text-white/75")}>
            Siguiente turno
            {next && <span className="hidden sm:inline"> · {nextDay}</span>}
          </p>
          <p className={NAME}>{next ? next.name : "Se nomina al publicar"}</p>
          {nextIsMe && <p className={cn(NOTE, "text-white/75")}>¡Te toca {nextDay}! Ve pensando tu canción 🎶</p>}
          {!next && <p className={cn(NOTE, "text-white/75")}>Quien presenta hoy elige a la siguiente persona.</p>}
        </div>
      </div>
    </div>
  );
}

const TILE =
  "flex flex-col items-start gap-2.5 rounded-2xl p-3.5 transition duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3";
const LABEL = "text-[10px] font-bold uppercase leading-tight tracking-[0.14em] sm:text-[11px] sm:tracking-[0.18em]";
// En móvil el nombre puede partirse en dos líneas en vez de cortarse.
const NAME = "mt-0.5 font-display text-base font-semibold leading-snug wrap-break-word sm:mt-0 sm:truncate sm:text-lg";
const NOTE = "mt-1 text-xs leading-snug sm:mt-0 sm:text-sm";

/** Cuándo le toca ("hoy", "mañana"…). Solo en móvil: desde sm va dentro de la etiqueta. */
function DayChip({ day, className }: { day: string; className?: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold first-letter:uppercase sm:hidden", className)}>
      {day}
    </span>
  );
}
