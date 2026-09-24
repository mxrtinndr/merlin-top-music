"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "merlin-fm:member-id";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredMemberId(id: string | null) {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage no disponible (modo privado estricto): la identidad dura lo que la pestaña.
  }
  listeners.forEach((listener) => listener());
}

/** undefined mientras no hemos hidratado (en servidor), null si no hay nadie elegido. */
export function useStoredMemberId(): string | null | undefined {
  return useSyncExternalStore<string | null | undefined>(subscribe, read, () => undefined);
}
