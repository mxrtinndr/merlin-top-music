"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isWorkday, nextWorkdayISO, relativeDayLabel, todayISO } from "@/lib/dates";
import { getSupabase } from "@/lib/supabase";
import type { DailyPick } from "@/lib/types";
import { useIdentity } from "@/components/identity/identity-provider";
import {
  readNotified,
  showNotification,
  useNotificationPrefs,
  useNotificationStatus,
  writeNotified,
  type NotificationKind,
} from "./notification-store";

export type LatestPick = Pick<
  DailyPick,
  "id" | "date" | "presenter_id" | "next_presenter_id" | "song_title" | "song_artist"
>;

/** Fecha de hoy que se actualiza sola: con la pestaña abierta de un día para otro, cambia a medianoche. */
function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const update = () => setToday(todayISO());
    const interval = setInterval(update, 60_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return today;
}

/**
 * Escucha en tiempo real las canciones del día: refresca la app cuando alguien
 * publica o edita una, y avisa con notificaciones de escritorio (una sola vez
 * por evento, y solo de los tipos que tengas activados):
 * - nomination: la canción de hoy te nomina (para mañana, o el lunes si es viernes).
 * - turn: hoy te toca a ti (te nominaron en la última canción). Solo de lunes a viernes.
 * - newPick: alguien ha publicado la canción de hoy y puedes puntuarla.
 */
export function PickNotifier({ latestPick }: { latestPick: LatestPick | null }) {
  const router = useRouter();
  const { currentMember, memberById } = useIdentity();
  const status = useNotificationStatus();
  const prefs = useNotificationPrefs();
  const today = useToday();

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

  const presenter = memberById(latestPick?.presenter_id);

  useEffect(() => {
    if (!latestPick || !currentMember || status !== "enabled") return;
    const me = currentMember.id;
    const presenterName = presenter?.name ?? "Alguien";
    const icon = presenter?.avatar_url ?? undefined;
    const isToday = latestPick.date === today;
    const nominatedMe = latestPick.next_presenter_id === me;

    const notify = (kind: NotificationKind, eventKey: string, title: string, body: string) => {
      if (!prefs[kind] || readNotified(kind, me) === eventKey) return;
      const shown = showNotification(kind, title, {
        body,
        tag: `${kind}-${eventKey}`,
        icon,
        onClick: () => router.push("/"),
      });
      if (shown) writeNotified(kind, me, eventKey);
    };

    if (isToday && latestPick.presenter_id !== me) {
      notify(
        "newPick",
        latestPick.id,
        "Nueva canción del día 🎶",
        `${presenterName} ha puesto «${latestPick.song_title}» de ${latestPick.song_artist}. ¡Entra a puntuarla!`,
      );
    }

    if (isToday && nominatedMe) {
      const turnDay = relativeDayLabel(nextWorkdayISO(latestPick.date), latestPick.date);
      notify(
        "nomination",
        latestPick.id,
        "¡Te han nominado! 🎤",
        `${presenterName} te ha elegido: ${turnDay} te toca recomendar la canción del día 🎶`,
      );
    }

    // La última canción es de otro día y te nominó: hoy es tu turno. Un aviso por día laborable.
    if (latestPick.date < today && nominatedMe && isWorkday(today)) {
      notify(
        "turn",
        today,
        "¡Hoy te toca! 🎤",
        `${presenterName} te nominó: elige la canción del día y nomina a la siguiente persona.`,
      );
    }
  }, [latestPick, currentMember, presenter, status, prefs, today, router]);

  return null;
}
