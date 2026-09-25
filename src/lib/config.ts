export const APP_NAME = "Merlin FM";
export const APP_TAGLINE = "La canción del día";
export const COMPANY_NAME = "Merlin Software";

/** Zona horaria que define qué es "hoy" (el equipo está en A Coruña). */
export const TIME_ZONE = "Europe/Madrid";

export const MEMBER_EMOJIS = [
  "🎧", "🎸", "🎹", "🥁", "🎷", "🎺", "🎻", "🎤", "🪩", "🧙",
  "🦉", "🦊", "🐙", "🐼", "🦄", "🌊", "⚡", "🚀", "🌵", "🍕",
] as const;

export const MEMBER_COLORS = [
  "#2E6FF2", "#1E4C8C", "#0EA5E9", "#14B8A6",
  "#22C55E", "#F59E0B", "#F43F5E", "#8B5CF6",
] as const;

/** Quién ha hecho la app (pie de página), con enlaces a sus perfiles. */
export const AUTHORS: ReadonlyArray<{ name: string; github?: string; youtube?: string }> = [
  { name: "Sara Salgueiro", github: "https://github.com/sarasalgueiro" },
  {
    name: "Martín",
    github: "https://github.com/martindelrioalvarez",
    youtube: "https://www.youtube.com/@talkingtigers",
  },
];
