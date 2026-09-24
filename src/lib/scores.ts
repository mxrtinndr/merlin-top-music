/**
 * Escala de puntuación. Si algún día el equipo quiere volver al 1–10, basta con
 * cambiar MAX_SCORE y SCORE_OPTIONS aquí y la constraint `ratings_score_range`
 * en una nueva migración (ver README).
 */
export const MIN_SCORE = 1;
export const MAX_SCORE = 4;

export type ScoreOption = { value: number; label: string; emoji: string };

export const SCORE_OPTIONS: readonly ScoreOption[] = [
  { value: 1, label: "No es lo mío", emoji: "🙉" },
  { value: 2, label: "Pasable", emoji: "😐" },
  { value: 3, label: "Me gusta", emoji: "😊" },
  { value: 4, label: "¡Temazo!", emoji: "🔥" },
];

export function scoreOption(value: number): ScoreOption | undefined {
  return SCORE_OPTIONS.find((option) => option.value === value);
}

export function isValidScore(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_SCORE && value <= MAX_SCORE;
}

const scoreFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function formatScore(value: number | null | undefined): string {
  return value == null ? "–" : scoreFormatter.format(value);
}

export type ScoreTone = "top" | "good" | "meh" | "low" | "none";

export function scoreTone(value: number | null | undefined): ScoreTone {
  if (value == null) return "none";
  const ratio = (value - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
  if (ratio >= 0.8) return "top";
  if (ratio >= 0.5) return "good";
  if (ratio >= 0.25) return "meh";
  return "low";
}

/** Porcentaje 0–100 de una nota respecto al máximo, para barras. */
export function scorePercent(value: number | null | undefined): number {
  if (value == null) return 0;
  return Math.max(0, Math.min(100, (value / MAX_SCORE) * 100));
}
