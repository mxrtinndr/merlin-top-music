import { APP_NAME } from "@/lib/config";

/** Se muestra si faltan las variables de entorno de Supabase o la base de datos no responde. */
export function SetupNotice({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-card">
        <p className="text-4xl">🔌</p>
        <h1 className="mt-4 text-2xl font-bold text-brand-800">
          {error ? "No podemos hablar con Supabase" : "Falta conectar Supabase"}
        </h1>
        {error && (
          <pre className="mt-3 overflow-x-auto rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</pre>
        )}
        <p className="mt-2 text-slate-600">
          {APP_NAME} necesita las variables <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>
            Copia <code>.env.local.example</code> a <code>.env.local</code> y rellena los valores (Supabase → Project Settings → API).
          </li>
          <li>
            Aplica las migraciones de <code>supabase/migrations</code> (ver README).
          </li>
          <li>Reinicia <code>npm run dev</code>. En Vercel, añade las variables y vuelve a desplegar.</li>
        </ol>
      </div>
    </main>
  );
}
