"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "./theme";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Si no hay elección guardada, seguimos los cambios del sistema.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (readStored() === null) applyTheme(media.matches);
  };
  media.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
  };
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  listeners.forEach((listener) => listener());
}

const isDark = () => document.documentElement.classList.contains("dark");

/** Botón sol/luna para cambiar entre tema claro y oscuro. */
export function ThemeToggle() {
  // undefined en el servidor: no sabemos el tema hasta hidratar.
  const dark = useSyncExternalStore<boolean | undefined>(subscribe, isDark, () => undefined);

  const toggle = () => {
    const next = !isDark();
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Sin localStorage el tema dura lo que la pestaña.
    }
    applyTheme(next);
  };

  const label = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:border-brand-200 hover:text-brand-600"
    >
      {dark === undefined ? null : dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </button>
  );
}
