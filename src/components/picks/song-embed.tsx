import { ExternalLink } from "lucide-react";
import { detectProvider, getSongEmbed, PROVIDER_LABELS } from "@/lib/music";

export function SongEmbed({ url, title }: { url: string | null; title: string }) {
  if (!url) return null;
  const embed = getSongEmbed(url);

  if (!embed) {
    const provider = detectProvider(url) ?? "other";
    return <ListenLink url={url} label={provider === "other" ? "Escuchar" : `Escuchar en ${PROVIDER_LABELS[provider]}`} />;
  }

  return (
    <div className="space-y-2">
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
      <ListenLink url={url} label={`Abrir en ${PROVIDER_LABELS[embed.provider]}`} subtle />
    </div>
  );
}

function ListenLink({ url, label, subtle }: { url: string; label: string; subtle?: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        subtle
          ? "inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600"
          : "inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
      }
    >
      <ExternalLink className={subtle ? "size-3.5" : "size-4"} />
      {label}
    </a>
  );
}
