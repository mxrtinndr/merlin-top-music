import { connection } from "next/server";
import { isISODate, startOfWeekISO, todayISO } from "@/lib/dates";
import { getLatestPickBefore, getPickById, getPicksBetween, getRatingsForPick } from "@/lib/queries";
import { detectGenres } from "@/lib/week-genres";
import { computeWeekStats } from "@/lib/week-stats";
import { TodayView } from "@/components/today/today-view";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TodayPage({ searchParams }: PageProps<"/">) {
  await connection(); // "hoy" se calcula en cada petición, nunca en el build
  const today = todayISO();
  const weekStart = startOfWeekISO(today);

  const params = await searchParams;
  const requested = params.dia;
  // ?cancion=<id>: cualquier canción (p. ej. desde el Ranking), aunque no sea de esta semana.
  const songId = typeof params.cancion === "string" && UUID.test(params.cancion) ? params.cancion : null;
  const [weekPicks, previousPick, linkedPick] = await Promise.all([
    getPicksBetween(weekStart, today),
    getLatestPickBefore(today),
    songId ? getPickById(songId) : null,
  ]);

  const todayPick = weekPicks.find((pick) => pick.date === today) ?? null;
  // ?dia=YYYY-MM-DD: otra canción de esta semana. Un día sin canción, u otra cosa → hoy.
  const requestedPick =
    linkedPick ?? (isISODate(requested) && requested < today ? weekPicks.find((item) => item.date === requested) : undefined);
  const selectedDate = requestedPick?.date ?? today;
  const pick = requestedPick ?? todayPick;
  const [ratings, genreById] = await Promise.all([pick ? getRatingsForPick(pick.id) : [], detectGenres(weekPicks)]);

  return (
    <TodayView
      today={today}
      weekStart={weekStart}
      selectedDate={selectedDate}
      pick={pick}
      todayPick={todayPick}
      ratings={ratings}
      previousPick={previousPick}
      weekPicks={weekPicks}
      stats={computeWeekStats(weekPicks, genreById)}
    />
  );
}
