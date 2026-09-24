import type { Metadata } from "next";
import { connection } from "next/server";
import { startOfMonthISO, startOfWeekISO, todayISO } from "@/lib/dates";
import { getLeaderboard } from "@/lib/queries";
import { formatScore, MAX_SCORE } from "@/lib/scores";
import type { LeaderboardRow } from "@/lib/types";
import { Card, Eyebrow } from "@/components/ui/card";
import { SegmentedLinks } from "@/components/ui/segmented-links";
import { MemberAvatar } from "@/components/member-avatar";
import { Podium } from "@/components/leaderboard/podium";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";

export const metadata: Metadata = { title: "Ranking" };

const PERIODS = [
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "todo", label: "Histórico" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

function parsePeriod(value: string | string[] | undefined): Period {
  return PERIODS.some((period) => period.value === value) ? (value as Period) : "todo";
}

function summarize(rows: LeaderboardRow[]) {
  const picks = rows.reduce((sum, row) => sum + row.picks_count, 0);
  const votes = rows.reduce((sum, row) => sum + row.ratings_count, 0);
  const weighted = rows.reduce((sum, row) => sum + (row.avg_score ?? 0) * row.ratings_count, 0);
  return { picks, votes, average: votes > 0 ? weighted / votes : null };
}

export default async function RankingPage({ searchParams }: PageProps<"/ranking">) {
  const period = parsePeriod((await searchParams).periodo);
  await connection();
  const today = todayISO();
  const from = period === "semana" ? startOfWeekISO(today) : period === "mes" ? startOfMonthISO(today) : null;

  const rows = await getLeaderboard(from);
  const ranked = rows.filter((row) => row.ratings_count > 0);
  const waiting = rows.filter((row) => row.ratings_count === 0 && row.active);
  const stats = summarize(rows);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Leaderboard</Eyebrow>
          <h1 className="mt-1 text-3xl font-bold text-brand-800 sm:text-4xl">Ranking del equipo</h1>
          <p className="mt-1 text-sm text-slate-500">Nota media recibida por las canciones de cada persona.</p>
        </div>
        <SegmentedLinks
          label="Periodo"
          options={PERIODS}
          active={period}
          hrefFor={(value) => (value === "todo" ? "/ranking" : `/ranking?periodo=${value}`)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Canciones" value={String(stats.picks)} />
        <Stat label="Votos" value={String(stats.votes)} />
        <Stat label="Media del equipo" value={formatScore(stats.average)} suffix={stats.average != null ? `/${MAX_SCORE}` : undefined} />
      </div>

      {ranked.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-4xl">🏁</p>
          <h2 className="mt-3 text-lg font-semibold text-brand-800">Aún no hay votos en este periodo</h2>
          <p className="mt-1 text-sm text-slate-500">En cuanto se puntúe la primera canción, aquí habrá podio.</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden px-3 pt-12 sm:px-8">
            <div className="mx-auto max-w-2xl">
              <Podium rows={ranked.slice(0, 3)} />
            </div>
          </Card>
          {ranked.length > 3 && <LeaderboardList rows={ranked.slice(3)} startRank={4} />}
        </>
      )}

      {waiting.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500">Sin votos en este periodo</h2>
          <ul className="flex flex-wrap gap-2">
            {waiting.map((row) => (
              <li
                key={row.member_id}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm text-slate-600"
              >
                <MemberAvatar member={row} size="xs" />
                {row.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <Card className="px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-brand-800 sm:text-3xl">
        {value}
        {suffix && <span className="text-sm font-medium text-slate-400">{suffix}</span>}
      </p>
    </Card>
  );
}
