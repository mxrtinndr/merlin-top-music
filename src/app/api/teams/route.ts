import type { NextRequest } from "next/server";
import { getHolidays, getMembers, getPickById } from "@/lib/queries";
import { newPickCard, teamsWebhookUrl } from "@/lib/teams";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Solo se avisa de canciones recién publicadas: evita reenvíos de canciones viejas. */
const MAX_AGE_MS = 10 * 60 * 1000;
/** Canciones ya avisadas por esta instancia del servidor (evita duplicados por reintentos). */
const notified = new Set<string>();

/**
 * POST /api/teams { pickId } → publica la tarjeta de la canción en el canal de
 * Teams. Lo llama el navegador justo después de publicar. Sin TEAMS_WEBHOOK_URL
 * no hace nada.
 */
export async function POST(request: NextRequest) {
  if (!teamsWebhookUrl) return new Response(null, { status: 204 });

  const { pickId } = (await request.json().catch(() => ({}))) as { pickId?: unknown };
  if (typeof pickId !== "string" || !UUID.test(pickId) || notified.has(pickId)) {
    return new Response(null, { status: 204 });
  }

  const pick = await getPickById(pickId);
  if (!pick || Date.now() - new Date(pick.created_at).getTime() > MAX_AGE_MS) {
    return new Response(null, { status: 204 });
  }
  notified.add(pickId);
  const [members, holidays] = await Promise.all([getMembers(), getHolidays(pick.date)]);

  const byId = new Map(members.map((member) => [member.id, member]));
  const card = newPickCard(pick, byId.get(pick.presenter_id), byId.get(pick.next_presenter_id), holidays, request.nextUrl.origin);
  const response = await fetch(teamsWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);

  if (!response?.ok) notified.delete(pickId); // que un reintento pueda volver a probar
  return new Response(null, { status: response?.ok ? 204 : 502 });
}
