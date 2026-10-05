"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/mutations";

/** Ejecuta una escritura del panel, refresca los datos y guarda el error para mostrarlo. */
export function useSaving() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await action();
      startRefresh(() => router.refresh());
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { run, busy: saving || refreshing, error, setError };
}
