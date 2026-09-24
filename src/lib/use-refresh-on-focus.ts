"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vuelve a pedir los datos al servidor cuando la pestaña recupera el foco
 * (p. ej. la dejaste abierta ayer, o alguien acaba de votar).
 */
export function useRefreshOnFocus(minIntervalMs = 30_000) {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < minIntervalMs) return;
      last = Date.now();
      router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router, minIntervalMs]);
}
