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

  return (
    <div className="mt-2 grid gap-3 sm:mt-4 sm:grid-cols-2">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-surface px-4 py-3 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
        <MemberAvatar member={presenter} size="md" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{capitalize(presenterDay)} presenta</p>
          <p className="truncate font-display text-lg font-semibold text-brand-900">
            {presenter?.name ?? "Por decidir"}
            {presenterIsMe && <span className="text-brand-500"> (tú)</span>}
          </p>
          {presenterIsMe && !next && (
            <p className="text-sm font-semibold text-brand-500">
              ¡{capitalize(presenterDay)} es tu turno de recomendar una canción! 🎤
            </p>
          )}
        </div>
      </div>

      <div
        className={cn(
          "relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-white shadow-lift transition duration-300 hover:-translate-y-0.5",
          "bg-linear-to-br from-deep-800 via-deep-700 to-brand-500",
        )}
      >
        {/* Brillo decorativo */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
        {next ? (
          <MemberAvatar member={next} size="md" className="ring-white/30" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
            <ArrowRight className="size-5" />
          </span>
        )}
        <div className="relative min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
            Siguiente turno{next && ` · ${nextDay}`}
          </p>
          <p className="truncate font-display text-lg font-semibold">
            {next ? next.name : "Se nomina al publicar"}
          </p>
          {nextIsMe && <p className="text-sm text-white/75">¡Te toca {nextDay}! Ve pensando tu canción 🎶</p>}
          {!next && <p className="text-sm text-white/75">Quien presenta hoy elige a la siguiente persona.</p>}
        </div>
      </div>
    </div>
  );
}
