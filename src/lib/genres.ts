// Géneros con los que agrupamos las canciones en el resumen de la semana.
// No se guardan: se deducen del catálogo de Apple Music al mostrar el resumen.

export const GENRES = [
  { name: "Pop", phrase: "el pop", emoji: "🎤" },
  { name: "Rock", phrase: "el rock", emoji: "🎸" },
  { name: "Indie / Alternativo", phrase: "el indie", emoji: "🌀" },
  { name: "Metal", phrase: "el metal", emoji: "🤘" },
  { name: "Punk", phrase: "el punk", emoji: "🧷" },
  { name: "Hip-Hop / Rap", phrase: "el hip-hop", emoji: "🎧" },
  { name: "R&B / Soul", phrase: "el R&B", emoji: "💜" },
  { name: "Electrónica", phrase: "la electrónica", emoji: "🪩" },
  { name: "Reggaetón / Urbano", phrase: "el reggaetón", emoji: "🔥" },
  { name: "Latino", phrase: "la música latina", emoji: "💃" },
  { name: "Flamenco", phrase: "el flamenco", emoji: "🌹" },
  { name: "Cantautor", phrase: "la canción de autor", emoji: "✍️" },
  { name: "Jazz", phrase: "el jazz", emoji: "🎷" },
  { name: "Blues", phrase: "el blues", emoji: "🎺" },
  { name: "Funk / Disco", phrase: "el funk", emoji: "🕺" },
  { name: "Reggae", phrase: "el reggae", emoji: "🌴" },
  { name: "Country / Folk", phrase: "el folk", emoji: "🤠" },
  { name: "Clásica", phrase: "la clásica", emoji: "🎻" },
  { name: "Bandas sonoras", phrase: "las bandas sonoras", emoji: "🎬" },
  { name: "K-Pop", phrase: "el K-Pop", emoji: "💫" },
  { name: "Otros", phrase: "«Otros»", emoji: "🎶" },
] as const;

export type Genre = (typeof GENRES)[number]["name"];

export function genreEmoji(name: string): string {
  return GENRES.find((genre) => genre.name === name)?.emoji ?? "🎶";
}

/** "la electrónica", "el rock"…: para frases como "esta semana domina …". */
export function genrePhrase(name: string): string {
  return GENRES.find((genre) => genre.name === name)?.phrase ?? name;
}

// Por orden: lo más específico primero ("pop latino" es Latino, "k-pop" no es Pop…).
const ITUNES_RULES: Array<[RegExp, Genre]> = [
  [/k-?pop/, "K-Pop"],
  [/reggaet|urban|trap latino/, "Reggaetón / Urbano"],
  [/latin|mexican|salsa|bachata|cumbia|tropical|merengue|tango|bolero|ranchera/, "Latino"],
  [/flamenco|rumba/, "Flamenco"],
  [/indie|alternativ/, "Indie / Alternativo"],
  [/metal/, "Metal"],
  [/punk/, "Punk"],
  [/hip.?hop|rap/, "Hip-Hop / Rap"],
  [/r&b|soul|gospel/, "R&B / Soul"],
  [/electr|dance|house|techno|trance|dubstep|drum|edm|ambient/, "Electrónica"],
  [/jazz/, "Jazz"],
  [/blues/, "Blues"],
  [/funk|disco/, "Funk / Disco"],
  [/reggae|ska/, "Reggae"],
  [/country|folk|americana|bluegrass/, "Country / Folk"],
  [/classical|cl[aá]sica|opera|[oó]pera/, "Clásica"],
  [/soundtrack|banda sonora|film|musical/, "Bandas sonoras"],
  [/singer|songwriter|cantautor/, "Cantautor"],
  [/rock/, "Rock"],
  [/pop/, "Pop"],
];

/** Traduce el género de Apple Music ("Hard Rock", "Pop Latino"…) a uno de los nuestros. */
export function genreFromItunes(name: string): Genre {
  const text = name.toLowerCase();
  return ITUNES_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? "Otros";
}
