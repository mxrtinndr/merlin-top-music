// Catálogo de Apple Music (solo servidor): carátulas y géneros.
import { normalizeText } from "./text";

/** Los datos de una canción no cambian: cacheamos las respuestas una semana. */
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const TIMEOUT_MS = 5_000;

export type ItunesTrack = { artistName: string; artworkUrl100?: string; primaryGenreName?: string };

export async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Busca la canción en Apple Music; solo acepta resultados del mismo artista.
 * Devuelve { track: null } si no está, y null si la búsqueda falló.
 */
export async function findItunesTrack(title: string, artist: string): Promise<{ track: ItunesTrack | null } | null> {
  if (!title.trim() || !artist.trim()) return { track: null };
  const params = new URLSearchParams({
    term: `${artist} ${title}`,
    entity: "song",
    limit: "5",
    country: "es",
  });
  const data = await getJson<{ results?: ItunesTrack[] }>(`https://itunes.apple.com/search?${params}`);
  if (!data) return null;
  const wanted = normalizeText(artist);
  const track = data.results?.find((result) => {
    const found = normalizeText(result.artistName);
    return found.includes(wanted) || wanted.includes(found);
  });
  return { track: track ?? null };
}
