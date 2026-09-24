"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-5xl">🎛️</p>
      <h1 className="mt-4 text-2xl font-bold text-brand-800">Se nos ha rayado el disco</h1>
      <p className="mt-2 text-slate-600">
        No hemos podido cargar los datos. Si acabas de montar el proyecto, revisa que las migraciones de Supabase estén
        aplicadas.
      </p>
      {error.message && (
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-100 px-4 py-3 text-left text-xs text-slate-600">
          {error.message}
        </pre>
      )}
      <Button className="mt-6" onClick={() => retry()}>
        Reintentar
      </Button>
    </div>
  );
}
