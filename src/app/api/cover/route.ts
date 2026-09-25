import type { NextRequest } from "next/server";
import { findCoverUrl } from "@/lib/covers";

/**
 * GET /api/cover?title=…&artist=…&url=… → redirige a la carátula de la canción,
 * o 404 si no la encontramos (el componente muestra entonces un icono).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = params.get("title")?.trim().slice(0, 200) ?? "";
  const artist = params.get("artist")?.trim().slice(0, 200) ?? "";
  const url = params.get("url")?.trim() || null;

  const cover = await findCoverUrl({ title, artist, url });
  if (!cover) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  }
  return new Response(null, {
    status: 307,
    headers: { Location: cover, "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
}
