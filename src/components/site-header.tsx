import Image from "next/image";
import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { UserMenu } from "@/components/identity/user-menu";
import { DesktopNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TurnBadge } from "@/components/today/turn-badge";

/** Proporción del logotipo oficial (viewBox 2907 × 878). */
const LOGO_WIDTH = 2907;
const LOGO_HEIGHT = 878;

/**
 * Logotipo de Merlín Software (manual de estilo 2025: azul índigo, y blanco
 * sobre fondo oscuro) y, separado por una línea, el nombre de la app.
 */
export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3 md:gap-4" aria-label={`${APP_NAME}, inicio`}>
      {/* SVG vectorial ya optimizado: no hace falta el optimizador de Next. */}
      <Image
        src="/brand/merlin-logo-blue.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        unoptimized
        priority
        className="h-9 w-auto dark:hidden md:h-11"
      />
      <Image
        src="/brand/merlin-logo-white.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        unoptimized
        priority
        className="hidden h-9 w-auto dark:block md:h-11"
      />
      {/* En móvil no cabe: solo el logotipo. */}
      <span className="hidden h-8 w-px bg-slate-200 sm:block md:h-10" aria-hidden />
      <span className="hidden leading-tight sm:block">
        <span className="flex items-end gap-1.5 font-display text-xl font-bold tracking-tight text-brand-700 md:text-2xl">
          FM
          {/* Mini ecualizador: se anima al pasar el ratón */}
          <span className="mb-1.5 flex h-3.5 items-end gap-[2px]" aria-hidden>
            {[0, 0.25, 0.5].map((delay) => (
              <span
                key={delay}
                className="h-full w-[3px] origin-bottom rounded-full bg-brand-400 group-hover:animate-eq"
                style={{ animationDelay: `${delay}s`, transform: `scaleY(${0.5 + delay})` }}
              />
            ))}
          </span>
        </span>
        <span className="hidden text-xs font-medium text-slate-500 sm:block">{APP_TAGLINE}</span>
      </span>
    </Link>
  );
}

/** turnMemberId: a quién le toca recomendar hoy (null si ya hay canción o no hay nominación). */
export function SiteHeader({ turnMemberId }: { turnMemberId: string | null }) {
  // Sin backdrop-blur: crearía un contenedor para los elementos fixed del menú de usuario.
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-linear-to-r from-brand-50 via-surface to-brand-50 shadow-[0_8px_30px_-24px_rgb(16_36_77/0.35)]">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 md:h-24">
        <Logo />
        <DesktopNav />
        <div className="flex items-center gap-2">
          <TurnBadge turnMemberId={turnMemberId} variant="pill" />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
      <TurnBadge turnMemberId={turnMemberId} variant="bar" />
    </header>
  );
}
