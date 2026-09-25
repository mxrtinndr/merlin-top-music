"use client";

import Link from "next/link";
import { useIdentity } from "@/components/identity/identity-provider";

const MESSAGE = "¡Hoy es tu turno de recomendar una canción!";

/**
 * Aviso el día que te toca recomendar canción: una píldora junto a tu usuario
 * en la cabecera ("pill", desde sm) o una franja bajo ella en móvil ("bar").
 */
export function TurnBadge({ turnMemberId, variant }: { turnMemberId: string | null; variant: "pill" | "bar" }) {
  const { currentMember } = useIdentity();
  if (!turnMemberId || currentMember?.id !== turnMemberId) return null;

  if (variant === "bar") {
    return (
      <Link
        href="/"
        className="block bg-sun px-4 py-2 text-center text-sm font-bold text-deep-700 sm:hidden"
      >
        🎤 {MESSAGE}
      </Link>
    );
  }

  return (
    <Link
      href="/"
      title={MESSAGE}
      className="hidden shrink-0 items-center gap-1.5 rounded-full bg-sun px-3 py-1.5 text-sm font-bold text-deep-700 shadow-sm shadow-deep-700/15 transition hover:brightness-95 animate-pop sm:flex"
    >
      <span aria-hidden>🎤</span>
      <span className="lg:hidden">¡Te toca!</span>
      <span className="hidden lg:inline">{MESSAGE}</span>
    </Link>
  );
}
