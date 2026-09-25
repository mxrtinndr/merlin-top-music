// Primer resultado de YouTube para una canción (solo servidor). Lo usa /api/youtube.

const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const TIMEOUT_MS = 5_000;

/** URL de la búsqueda en YouTube: el plan B si no sacamos el primer vídeo. */
export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/**
 * Id del primer vídeo que da el buscador de YouTube. No hay API sin clave, así
 * que leemos la página de resultados: si YouTube cambia su HTML, devuelve null
 * y la app cae a la búsqueda.
 */
export async function findFirstVideoId(query: string): Promise<string | null> {
  try {
    const response = await fetch(`${youtubeSearchUrl(query)}&hl=es`, {
      headers: {
        "Accept-Language": "es-ES,es;q=0.9",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const html = await response.text();
    return html.match(/"videoRenderer":\{"videoId":"([\w-]{11})"/)?.[1] ?? null;
  } catch {
    return null;
  }
}
