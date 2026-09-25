"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { DailyPick } from "@/lib/types";
import { useIdentity } from "@/components/identity/identity-provider";
import { readNotifiedPick, showNotification, useNotificationStatus, writeNotifiedPick } from "./notification-store";

export type LatestPick = Pick<DailyPick, "id" | "presenter_id" | "next_presenter_id">;

/**
 * Escucha en tiempo real las canciones del día: refresca la app cuando alguien
 * publica o edita una, y si la nueva nominación es para ti, te avisa con una
 * notificación de escritorio (una sola vez por canción).
 */
export function NominationNotifier({ latestPick }: { latestPick: LatestPick | null }) {
  const router = useRouter();
  const { currentMember, memberById } = useIdentity();
  const status = useNotificationStatus();

  useEffect(() => {
    const supabase = getSupabase();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel("daily-picks")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_picks" }, () => {
        // Varios eventos seguidos (p. ej. publicar y editar) → un solo refresco.
        clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), 500);
      })
      .subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  const nominatedMe = latestPick !== null && currentMember !== null && latestPick.next_presenter_id === currentMember.id;
  const presenter = memberById(latestPick?.presenter_id);

  useEffect(() => {
    if (!nominatedMe || !latestPick || !currentMember || status !== "enabled") return;
    if (readNotifiedPick(currentMember.id) === latestPick.id) return;
    const shown = showNotification("¡Te han nominado! 🎤", {
      body: `${presenter?.name ?? "Alguien"} te ha elegido: te toca recomendar la próxima canción del día 🎶`,
      tag: `nomination-${latestPick.id}`,
      icon: presenter?.avatar_url ?? undefined,
      onClick: () => router.push("/"),
    });
    if (shown) writeNotifiedPick(currentMember.id, latestPick.id);
  }, [nominatedMe, latestPick, currentMember, presenter, status, router]);

  return null;
}
