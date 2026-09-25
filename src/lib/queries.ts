// Lecturas para Server Components. No importar desde componentes cliente.
import { cache } from "react";
import { connection } from "next/server";
import { getSupabase } from "./supabase";
import type { DailyPick, LeaderboardRow, Member, Rating } from "./types";

const PICK_COLUMNS =
  "id, date, presenter_id, song_title, song_artist, song_url, presenter_comment, next_presenter_id, created_at, ratings_count, avg_score";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/** Todos los miembros (activos e inactivos). Memoizado por request: layout y páginas lo comparten. */
export const getMembers = cache(async (): Promise<Member[]> => {
  await connection();
  return unwrap(
    await getSupabase()
      .from("members")
      .select("id, name, emoji, color, avatar_url, has_pin, active, created_at")
      .order("name"),
  );
});

export async function getPickByDate(date: string): Promise<DailyPick | null> {
  await connection();
  return unwrap(
    await getSupabase().from("daily_picks_summary").select(PICK_COLUMNS).eq("date", date).maybeSingle(),
  );
}

export async function getPickById(id: string): Promise<DailyPick | null> {
  await connection();
  return unwrap(
    await getSupabase().from("daily_picks_summary").select(PICK_COLUMNS).eq("id", id).maybeSingle(),
  );
}

/** La última canción anterior a la fecha dada: su nominación decide quién presenta hoy. */
export async function getLatestPickBefore(date: string): Promise<DailyPick | null> {
  await connection();
  return unwrap(
    await getSupabase()
      .from("daily_picks_summary")
      .select(PICK_COLUMNS)
      .lt("date", date)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

/** La canción más reciente: su nominación dice a quién le toca presentar. */
export async function getLatestPick(): Promise<DailyPick | null> {
  await connection();
  return unwrap(
    await getSupabase()
      .from("daily_picks_summary")
      .select(PICK_COLUMNS)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

/** Canciones entre dos fechas (incluidas), de la más antigua a la más reciente. */
export async function getPicksBetween(from: string, to: string): Promise<DailyPick[]> {
  await connection();
  return unwrap(
    await getSupabase()
      .from("daily_picks_summary")
      .select(PICK_COLUMNS)
      .gte("date", from)
      .lte("date", to)
      .order("date"),
  );
}

export type PickOrder = "recientes" | "mejores" | "peores";

export async function getPicks(order: PickOrder): Promise<DailyPick[]> {
  await connection();
  let query = getSupabase().from("daily_picks_summary").select(PICK_COLUMNS);
  if (order === "recientes") {
    query = query.order("date", { ascending: false });
  } else {
    // Solo tienen sentido en el podio/vergüenza las canciones con votos.
    query = query
      .gt("ratings_count", 0)
      .order("avg_score", { ascending: order === "peores" })
      .order("ratings_count", { ascending: false })
      .order("date", { ascending: false })
      .limit(20);
  }
  return unwrap(await query);
}

/** Canciones mejor puntuadas desde una fecha (null = histórico completo). */
export async function getTopPicks(from: string | null, limit = 10): Promise<DailyPick[]> {
  await connection();
  let query = getSupabase().from("daily_picks_summary").select(PICK_COLUMNS).gt("ratings_count", 0);
  if (from) query = query.gte("date", from);
  return unwrap(
    await query
      .order("avg_score", { ascending: false })
      .order("ratings_count", { ascending: false })
      .order("date", { ascending: false })
      .limit(limit),
  );
}

export async function getRatingsForPick(pickId: string): Promise<Rating[]> {
  await connection();
  return unwrap(
    await getSupabase()
      .from("ratings")
      .select("id, daily_pick_id, member_id, score, comment, created_at")
      .eq("daily_pick_id", pickId)
      .order("created_at"),
  );
}

export async function getLeaderboard(from: string | null): Promise<LeaderboardRow[]> {
  await connection();
  return unwrap(await getSupabase().rpc("get_leaderboard", { p_from: from, p_to: null }));
}
