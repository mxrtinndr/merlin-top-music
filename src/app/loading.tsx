export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-slate-200/50" />
    </div>
  );
}
