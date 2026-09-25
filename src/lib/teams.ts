// Aviso en un canal de Microsoft Teams al publicar la canción del día (solo servidor).
// Se configura con TEAMS_WEBHOOK_URL: la URL de un flujo de Teams
// "Publicar en un canal cuando se reciba una solicitud de webhook".

import { nextWorkdayISO, relativeDayLabel } from "./dates";
import type { DailyPick, Member } from "./types";

export const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;

type TextBlock = { type: "TextBlock"; text: string; wrap: true; size?: string; weight?: string; isSubtle?: boolean };

const text = (value: string, extra: Partial<TextBlock> = {}): TextBlock => ({ type: "TextBlock", text: value, wrap: true, ...extra });

/** Tarjeta adaptativa: canción, quién la presenta, su comentario y a quién le toca después. */
export function newPickCard(pick: DailyPick, presenter: Member | undefined, next: Member | undefined, appUrl: string) {
  const body: TextBlock[] = [
    text("🎵 Nueva canción del día", { size: "Large", weight: "Bolder" }),
    text(`**${presenter?.name ?? "Alguien"}** ha recomendado **${pick.song_title}** de ${pick.song_artist}.`),
  ];
  if (pick.presenter_comment) body.push(text(`“${pick.presenter_comment}”`, { isSubtle: true }));
  if (next) {
    const turnDay = relativeDayLabel(nextWorkdayISO(pick.date), pick.date);
    body.push(text(`🎤 Nominación para el siguiente turno (${turnDay}): **${next.name}**. ¡Ve pensando tu canción!`));
  }

  const actions = [{ type: "Action.OpenUrl", title: "Escuchar y votar", url: appUrl }];
  if (pick.song_url) actions.push({ type: "Action.OpenUrl", title: "Abrir en Spotify", url: pick.song_url });

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body,
          actions,
        },
      },
    ],
  };
}
