// Género de cada canción de la semana, deducido de Apple Music (solo servidor).
import { genreFromItunes } from "./genres";
import { findItunesTrack } from "./itunes";
import type { DailyPick } from "./types";

/**
 * id de la canción → género. Las que Apple no conoce (o si no responde) no
 * aparecen y el resumen simplemente no las cuenta. Las búsquedas se cachean una
 * semana, así que solo la primera visita tras publicar hace peticiones nuevas.
 */
export async function detectGenres(picks: DailyPick[]): Promise<Map<string, string>> {
  const entries = await Promise.all(
    picks.map(async (pick) => {
      const genre = (await findItunesTrack(pick.song_title, pick.song_artist))?.track?.primaryGenreName;
      return genre ? ([pick.id, genreFromItunes(genre)] as const) : null;
    }),
  );
  return new Map(entries.filter((entry) => entry !== null));
}
