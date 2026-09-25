// Resumen de las canciones de una semana (sección inferior de la portada).
import type { DailyPick } from "./types";

export type GenreShare = { genre: string; count: number; percent: number };

export type WeekStats = {
  picksCount: number;
  ratingsCount: number;
  /** Media de todas las notas de la semana (no la media de las medias). */
  averageScore: number | null;
  /** De más a menos escuchado; porcentaje sobre las canciones con género conocido. */
  genres: GenreShare[];
  /** Mejor nota media de la semana (solo canciones con votos). */
  topSong: DailyPick | null;
  /** La que más votos ha recibido, si no es ya la top canción. */
  mostVoted: DailyPick | null;
};

export function computeWeekStats(picks: DailyPick[], genreById: Map<string, string>): WeekStats {
  const counts = new Map<string, number>();
  for (const pick of picks) {
    const genre = genreById.get(pick.id);
    if (genre) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  const classified = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const genres = [...counts.entries()]
    .map(([genre, count]) => ({ genre, count, percent: Math.round((count / classified) * 100) }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre, "es"));

  const rated = picks.filter((pick) => pick.ratings_count > 0 && pick.avg_score !== null);
  const ratingsCount = rated.reduce((sum, pick) => sum + pick.ratings_count, 0);
  const scoreSum = rated.reduce((sum, pick) => sum + pick.avg_score! * pick.ratings_count, 0);
  const topSong =
    [...rated].sort((a, b) => b.avg_score! - a.avg_score! || b.ratings_count - a.ratings_count)[0] ?? null;
  const mostVoted = [...rated].sort((a, b) => b.ratings_count - a.ratings_count || b.avg_score! - a.avg_score!)[0] ?? null;

  return {
    picksCount: picks.length,
    ratingsCount,
    averageScore: ratingsCount > 0 ? scoreSum / ratingsCount : null,
    genres,
    topSong,
    mostVoted: mostVoted && mostVoted.id !== topSong?.id ? mostVoted : null,
  };
}
