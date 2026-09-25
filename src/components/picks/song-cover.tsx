"use client";

import { useState } from "react";
import Image from "next/image";
import { Music } from "lucide-react";
import { cn } from "@/lib/cn";
import { coverSrc } from "@/lib/music";
import type { DailyPick } from "@/lib/types";

const SIZES = {
  sm: { className: "size-12 rounded-xl", icon: "size-5", px: 48 },
  md: { className: "size-24 rounded-xl", icon: "size-8", px: 96 },
  lg: { className: "size-20 rounded-2xl sm:size-24", icon: "size-8", px: 96 },
  xl: { className: "size-44 rounded-2xl sm:size-52", icon: "size-12", px: 208 },
} as const;

/** Carátula de la canción; si no la encontramos, una nota musical sobre el degradado de marca. */
export function SongCover({
  pick,
  size = "sm",
  className,
}: {
  pick: Pick<DailyPick, "song_title" | "song_artist" | "song_url">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { className: sizeClass, icon, px } = SIZES[size];
  const src = coverSrc(pick);
  // Guardamos qué src falló: si cambia el enlace (al editar), se vuelve a intentar.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-deep-700 to-brand-400 text-white/80 shadow-sm",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      <Music className={icon} />
      {failedSrc !== src && (
        // Viene ya dimensionada desde Spotify/Apple/YouTube: no hace falta el optimizador de Next.
        <Image
          src={src}
          alt=""
          width={px}
          height={px}
          unoptimized
          // La grande está arriba del todo (portada): que no espere al scroll.
          loading={size === "lg" ? "eager" : "lazy"}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      )}
    </span>
  );
}
