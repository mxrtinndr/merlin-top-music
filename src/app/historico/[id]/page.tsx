import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatLongDate, todayISO } from "@/lib/dates";
import { getPickById, getRatingsForPick } from "@/lib/queries";
import { Eyebrow } from "@/components/ui/card";
import { PickDetail } from "@/components/picks/pick-detail";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadPick(id: string) {
  return UUID.test(id) ? getPickById(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/historico/[id]">): Promise<Metadata> {
  const pick = await loadPick((await params).id);
  return { title: pick ? `${pick.song_title} · ${pick.song_artist}` : "Canción" };
}

export default async function PickPage({ params }: PageProps<"/historico/[id]">) {
  const pick = await loadPick((await params).id);
  if (!pick) notFound();
  const ratings = await getRatingsForPick(pick.id);
  const isToday = pick.date === todayISO();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/historico"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600"
        >
          <ArrowLeft className="size-4" /> Histórico
        </Link>
        <Eyebrow className="mt-4 first-letter:uppercase">{isToday ? "Hoy" : formatLongDate(pick.date)}</Eyebrow>
        <h1 className="mt-1 text-3xl font-bold text-brand-800 sm:text-4xl">La canción del día</h1>
      </div>
      {/* Se puede puntuar tarde, pero solo se edita el mismo día. */}
      <PickDetail pick={pick} ratings={ratings} editable={isToday} />
    </div>
  );
}
