import { connection } from "next/server";
import { todayISO } from "@/lib/dates";
import { getLatestPickBefore, getPickByDate, getRatingsForPick } from "@/lib/queries";
import { TodayView } from "@/components/today/today-view";

export default async function TodayPage() {
  await connection(); // "hoy" se calcula en cada petición, nunca en el build
  const today = todayISO();
  const [pick, previousPick] = await Promise.all([getPickByDate(today), getLatestPickBefore(today)]);
  const ratings = pick ? await getRatingsForPick(pick.id) : [];

  return <TodayView today={today} pick={pick} ratings={ratings} previousPick={previousPick} />;
}
