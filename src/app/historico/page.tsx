import type { Metadata } from "next";
import { formatMonth } from "@/lib/dates";
import { getMembers, getPicks, type PickOrder } from "@/lib/queries";
import type { DailyPick } from "@/lib/types";
import { Card, Eyebrow } from "@/components/ui/card";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { PickListItem } from "@/components/picks/pick-list-item";

export const metadata: Metadata = { title: "Histórico" };

const ORDERS = [
  { value: "recientes", label: "Recientes" },
  { value: "mejores", label: "🏆 Hall of Fame" },
  { value: "peores", label: "🙈 Vergüenza" },
] as const satisfies ReadonlyArray<{ value: PickOrder; label: string }>;

const DESCRIPTIONS: Record<PickOrder, string> = {
  recientes: "Todas las canciones del día, de la más reciente a la más antigua.",
  mejores: "Hall of Fame: las 20 canciones mejor puntuadas de la historia del equipo.",
  peores: "El salón de la vergüenza: las 20 que peor sonaron… con cariño.",
};

function parseOrder(value: string | string[] | undefined): PickOrder {
  return ORDERS.some((order) => order.value === value) ? (value as PickOrder) : "recientes";
}

function groupByMonth(picks: DailyPick[]): Array<{ month: string; picks: DailyPick[] }> {
  const groups = new Map<string, DailyPick[]>();
  for (const pick of picks) {
    const key = pick.date.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), pick]);
  }
  return [...groups.entries()].map(([key, items]) => ({ month: formatMonth(`${key}-01`), picks: items }));
}

export default async function HistoryPage({ searchParams }: PageProps<"/historico">) {
  const order = parseOrder((await searchParams).orden);
  const [picks, members] = await Promise.all([getPicks(order), getMembers()]);
  const memberById = new Map(members.map((member) => [member.id, member]));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Eyebrow>Histórico</Eyebrow>
          <h1 className="mt-1 text-3xl font-bold text-brand-800 sm:text-4xl">Todas las canciones</h1>
          <p className="mt-1 text-sm text-slate-500">{DESCRIPTIONS[order]}</p>
        </div>
        <SegmentedLinks
          label="Orden"
          options={ORDERS}
          active={order}
          hrefFor={(value) => (value === "recientes" ? "/historico" : `/historico?orden=${value}`)}
        />
      </div>

      {picks.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-4xl">📼</p>
          <h2 className="mt-3 text-lg font-semibold text-brand-800">
            {order === "recientes" ? "Aún no hay canciones" : "Aún no hay canciones con votos"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">La historia empieza con la primera canción del día.</p>
        </Card>
      ) : order === "recientes" ? (
        groupByMonth(picks).map((group) => (
          <section key={group.month} className="space-y-2">
            <h2 className="sticky top-20 z-10 md:top-24 -mx-1 bg-canvas/90 px-1 py-2 text-sm font-semibold capitalize text-slate-500 backdrop-blur">
              {group.month}
            </h2>
            {group.picks.map((pick) => (
              <PickListItem key={pick.id} pick={pick} presenter={memberById.get(pick.presenter_id)} />
            ))}
          </section>
        ))
      ) : (
        <div className="space-y-2">
          {picks.map((pick, index) => (
            <PickListItem
              key={pick.id}
              pick={pick}
              presenter={memberById.get(pick.presenter_id)}
              rank={index + 1}
              rankEmoji={order === "mejores" ? (["🥇", "🥈", "🥉"][index] ?? "🎵") : index === 0 ? "💀" : "🙈"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
