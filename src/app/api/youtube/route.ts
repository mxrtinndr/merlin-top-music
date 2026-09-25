import type { NextRequest } from "next/server";
import { findFirstVideoId, youtubeSearchUrl } from "@/lib/youtube";

/**
 * GET /api/youtube?title=…&artist=… → redirige al primer vídeo que da el
 * buscador de YouTube para "título artista", o a la búsqueda si no lo encontramos.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = params.get("title")?.trim().slice(0, 200) ?? "";
  const artist = params.get("artist")?.trim().slice(0, 200) ?? "";
  const query = `${title} ${artist}`.trim();

  const videoId = query ? await findFirstVideoId(query) : null;
  if (!videoId) {
    return new Response(null, {
      status: 307,
      headers: { Location: youtubeSearchUrl(query), "Cache-Control": "public, max-age=3600" },
    });
  }
  return new Response(null, {
    status: 307,
    headers: {
      Location: `https://www.youtube.com/watch?v=${videoId}`,
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
