// Búsqueda de carátulas (solo servidor). La usa la ruta /api/cover.
import { findItunesTrack, getJson } from "./itunes";
import { detectProvider, youtubeVideoId } from "./music";

async function spotifyCover(url: string): Promise<string | null> {
  const data = await getJson<{ thumbnail_url?: string }>(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
  );
  return data?.thumbnail_url ?? null;
}

/**
 * La mejor carátula que encontremos: la de Spotify si el enlace es de Spotify;
 * si no, la del catálogo de Apple; y como último recurso, la miniatura del vídeo.
 */
export async function findCoverUrl(song: { title: string; artist: string; url: string | null }): Promise<string | null> {
  if (song.url && detectProvider(song.url) === "spotify") {
    const cover = await spotifyCover(song.url);
    if (cover) return cover;
  }
  const track = (await findItunesTrack(song.title, song.artist))?.track;
  if (track?.artworkUrl100) return track.artworkUrl100.replace(/\/100x100bb\./, "/600x600bb.");
  const videoId = youtubeVideoId(song.url);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}
