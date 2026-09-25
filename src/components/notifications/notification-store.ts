"use client";

import { useMemo, useSyncExternalStore } from "react";

// Preferencia de avisos de escritorio: el permiso lo guarda el navegador y
// "silenciado" lo guardamos nosotros, para poder apagarlos sin ir a los ajustes.
// Qué tipos de aviso quieres también se guarda aquí, en este navegador.

const MUTED_KEY = "merlin-fm:notifications-muted";
const PREFS_KEY = "merlin-fm:notification-prefs";

export type NotificationStatus = "unsupported" | "default" | "denied" | "enabled" | "muted";

/** nomination: te han nominado · turn: hoy te toca · newPick: hay canción nueva que puntuar. */
export type NotificationKind = "nomination" | "turn" | "newPick";
export type NotificationPrefs = Record<NotificationKind, boolean>;

const DEFAULT_PREFS: NotificationPrefs = { nomination: true, turn: true, newPick: true };

// Qué evento se avisó por última vez, por tipo y miembro (para no repetir).
// La nominación conserva la clave antigua para no repetir avisos ya dados.
const NOTIFIED_KEY_PREFIX: Record<NotificationKind, string> = {
  nomination: "merlin-fm:notified-pick:",
  turn: "merlin-fm:notified-turn:",
  newPick: "merlin-fm:notified-new-pick:",
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  // Si se cambia el permiso desde la barra de direcciones, nos enteramos al volver a la pestaña.
  document.addEventListener("visibilitychange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    document.removeEventListener("visibilitychange", listener);
  };
}

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // localStorage no disponible: la preferencia dura lo que la pestaña.
  }
}

function readStatus(): NotificationStatus {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return readItem(MUTED_KEY) ? "muted" : "enabled";
  return Notification.permission;
}

/** undefined en el servidor, antes de hidratar. */
export function useNotificationStatus(): NotificationStatus | undefined {
  return useSyncExternalStore<NotificationStatus | undefined>(subscribe, readStatus, () => undefined);
}

/** Pide permiso (hay que llamarlo desde un clic) y quita el silencio. */
export async function enableNotifications(): Promise<NotificationStatus> {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "default") await Notification.requestPermission();
  writeItem(MUTED_KEY, null);
  emit();
  return readStatus();
}

export function muteNotifications() {
  writeItem(MUTED_KEY, "1");
  emit();
}

function parsePrefs(raw: string | null): NotificationPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Qué tipos de aviso quiere recibir quien usa este navegador. */
export function useNotificationPrefs(): NotificationPrefs {
  // La instantánea es el texto guardado (estable entre lecturas); se parsea aparte.
  const raw = useSyncExternalStore<string | null>(subscribe, () => readItem(PREFS_KEY), () => null);
  return useMemo(() => parsePrefs(raw), [raw]);
}

export function setNotificationPref(kind: NotificationKind, enabled: boolean) {
  writeItem(PREFS_KEY, JSON.stringify({ ...parsePrefs(readItem(PREFS_KEY)), [kind]: enabled }));
  emit();
}

/** Evento (canción o fecha) por el que ya avisamos a este miembro. */
export function readNotified(kind: NotificationKind, memberId: string): string | null {
  return readItem(NOTIFIED_KEY_PREFIX[kind] + memberId);
}

export function writeNotified(kind: NotificationKind, memberId: string, eventKey: string) {
  writeItem(NOTIFIED_KEY_PREFIX[kind] + memberId, eventKey);
}

type NotificationOptions = { body: string; tag: string; icon?: string; onClick?: () => void };

/**
 * Muestra un aviso de escritorio si están activados y ese tipo no está apagado.
 * Al pulsarlo, trae la app al frente.
 */
export function showNotification(kind: NotificationKind, title: string, options: NotificationOptions): boolean {
  if (!parsePrefs(readItem(PREFS_KEY))[kind]) return false;
  return display(title, options);
}

/** Aviso de prueba desde Notificaciones: ignora los tipos, pero respeta el interruptor general. */
export function showTestNotification(): boolean {
  return display("Prueba de Merlin FM 🎶", {
    body: "¡Funciona! Así te llegarán los avisos de canciones, nominaciones y turnos.",
    tag: "test",
  });
}

function display(title: string, options: NotificationOptions): boolean {
  if (readStatus() !== "enabled") return false;
  const { onClick, ...init } = options;
  try {
    const notification = new Notification(title, { ...init, lang: "es" });
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
    return true;
  } catch {
    // Algunos navegadores móviles solo permiten avisos desde un service worker.
    return false;
  }
}
