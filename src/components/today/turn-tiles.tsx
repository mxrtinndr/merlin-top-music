"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Member } from "@/lib/types";
import { MemberAvatar } from "@/components/member-avatar";

/** Las dos baldosas de la portada: quién presenta hoy y quién va después. */
export function TurnTiles({
  presenter,
  next,
  currentMemberId,
}: {
  presenter: Member | undefined;
  next: Member | undefined;
  currentMemberId: string | undefined;
}) {
  const nextIsMe = next !== undefined && next.id === currentMemberId;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
        <MemberAvatar member={presenter} size="lg" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Hoy presenta</p>
          <p className="truncate font-display text-xl font-semibold text-brand-900">
            {presenter?.name ?? "Por decidir"}
            {presenter && presenter.id === currentMemberId && <span className="text-brand-500"> (tú)</span>}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "relative flex items-center gap-4 overflow-hidden rounded-2xl p-4 text-white shadow-lift",
          "bg-linear-to-br from-brand-800 via-brand-700 to-brand-500",
        )}
      >
        {/* Brillo decorativo */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
        {next ? (
          <MemberAvatar member={next} size="lg" className="ring-white/30" />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/10">
            <ArrowRight className="size-6" />
          </span>
        )}
        <div className="relative min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-100">Siguiente turno</p>
          <p className="truncate font-display text-xl font-semibold">
            {next ? next.name : "Se nomina al publicar"}
          </p>
          {nextIsMe && <p className="text-sm text-brand-100">¡Te toca! Ve pensando tu canción 🎶</p>}
          {!next && <p className="text-sm text-brand-100">Quien presenta hoy elige a la siguiente persona.</p>}
        </div>
      </div>
    </div>
  );
}
