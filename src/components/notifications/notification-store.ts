"use client";

import { useSyncExternalStore } from "react";

// Preferencia de avisos de escritorio: el permiso lo guarda el navegador y
// "silenciado" lo guardamos nosotros, para poder apagarlos sin ir a los ajustes.

const MUTED_KEY = "merlin-fm:notifications-muted";
const NOTIFIED_KEY_PREFIX = "merlin-fm:notified-pick:";

export type NotificationStatus = "unsupported" | "default" | "denied" | "enabled" | "muted";

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

/** Canción por la que ya avisamos a este miembro (para no repetir el aviso). */
export function readNotifiedPick(memberId: string): string | null {
  return readItem(NOTIFIED_KEY_PREFIX + memberId);
}

export function writeNotifiedPick(memberId: string, pickId: string) {
  writeItem(NOTIFIED_KEY_PREFIX + memberId, pickId);
}

/** Muestra un aviso de escritorio si están activados. Al pulsarlo, trae la app al frente. */
export function showNotification(
  title: string,
  options: { body: string; tag: string; icon?: string; onClick?: () => void },
): boolean {
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
