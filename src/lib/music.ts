export type MusicProvider = "spotify" | "youtube" | "other";

export type SongEmbed = {
  provider: Exclude<MusicProvider, "other">;
  src: string;
  /** Alto fijo en px (Spotify) o null para usar proporción 16:9 (YouTube). */
  height: number | null;
};

function parseUrl(url: string): URL | null {
  try {
    return new URL(url.trim());
  } catch {
    return null;
  }
}

export function isHttpUrl(url: string): boolean {
  const parsed = parseUrl(url);
  return parsed !== null && (parsed.protocol === "http:" || parsed.protocol === "https:");
}

export function detectProvider(url: string | null | undefined): MusicProvider | null {
  if (!url) return null;
  const parsed = parseUrl(url);
  if (!parsed) return null;
  const host = parsed.hostname.replace(/^www\./, "");
  if (host.endsWith("spotify.com") || host === "spotify.link") return "spotify";
  if (host === "youtu.be" || host.endsWith("youtube.com")) return "youtube";
  return "other";
}

const SPOTIFY_TYPES = new Set(["track", "album", "playlist", "episode", "artist"]);

function spotifyEmbed(url: URL): SongEmbed | null {
  if (!url.hostname.endsWith("open.spotify.com")) return null;
  // /track/ID, /intl-es/track/ID, /embed/track/ID
  const parts = url.pathname.split("/").filter(Boolean);
  const typeIndex = parts.findIndex((part) => SPOTIFY_TYPES.has(part));
  const type = parts[typeIndex];
  const id = parts[typeIndex + 1];
  if (typeIndex === -1 || !id) return null;
  return {
    provider: "spotify",
    src: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`,
    height: type === "track" || type === "episode" ? 152 : 352,
  };
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (url.searchParams.get("v")) return url.searchParams.get("v");
  const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/);
  return match?.[1] ?? null;
}

/** Devuelve cómo incrustar la canción, o null si el enlace no es de Spotify/YouTube. */
export function getSongEmbed(rawUrl: string | null | undefined): SongEmbed | null {
  if (!rawUrl) return null;
  const url = parseUrl(rawUrl);
  if (!url) return null;
  const provider = detectProvider(rawUrl);
  if (provider === "spotify") return spotifyEmbed(url);
  if (provider === "youtube") {
    const id = youtubeId(url);
    return id
      ? { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}`, height: null }
      : null;
  }
  return null;
}

export const PROVIDER_LABELS: Record<MusicProvider, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  other: "Enlace",
};
