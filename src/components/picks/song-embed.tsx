import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { getSongEmbed, getSongLinks, PROVIDER_LABELS } from "@/lib/music";
import type { DailyPick } from "@/lib/types";
import { SpotifyIcon, YouTubeIcon } from "@/components/brand-icons";

export function SongEmbed({ url, title }: { url: string | null; title: string }) {
  const embed = url ? getSongEmbed(url) : null;
  if (!embed) return null;

  return (
    <div
      className={
        embed.height === null
          ? "aspect-video overflow-hidden rounded-2xl bg-slate-900"
          : "overflow-hidden rounded-2xl bg-slate-100"
      }
      style={embed.height === null ? undefined : { height: embed.height }}
    >
      <iframe
        src={embed.src}
        title={`${title} en ${PROVIDER_LABELS[embed.provider]}`}
        className="size-full"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/** Logos de Spotify y YouTube (y del enlace original, si es de otro sitio) para abrir la canción. */
export function SongLinks({ pick }: { pick: Pick<DailyPick, "song_title" | "song_artist" | "song_url"> }) {
  const links = getSongLinks(pick);
  return (
    <div className="flex items-center gap-2">
      <ListenLink url={links.spotify} label="Abrir en Spotify" className="text-[#1DB954]">
        <SpotifyIcon className="size-5" />
      </ListenLink>
      <ListenLink url={links.youtube} label="Abrir en YouTube" className="text-[#FF0033]">
        <YouTubeIcon className="size-5" />
      </ListenLink>
      {links.other && (
        <ListenLink url={links.other} label="Abrir enlace" className="text-brand-600">
          <ExternalLink className="size-4" />
        </ListenLink>
      )}
    </div>
  );
}

function ListenLink({
  url,
  label,
  className,
  children,
}: {
  url: string;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-slate-200 bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card",
        className,
      )}
    >
      {children}
    </a>
  );
}
