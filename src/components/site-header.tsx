import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { UserMenu } from "@/components/identity/user-menu";
import { DesktopNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TurnBadge } from "@/components/today/turn-badge";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${APP_NAME}, inicio`}>
      <span className="relative flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-deep-800 shadow-md shadow-deep-700/25 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        {/* Mini ecualizador */}
        <span className="flex h-5 items-end gap-[3px]" aria-hidden>
          {[0, 0.25, 0.5].map((delay) => (
            <span
              key={delay}
              className="h-full w-[3px] origin-bottom rounded-full bg-white group-hover:animate-eq"
              style={{ animationDelay: `${delay}s`, transform: `scaleY(${0.5 + delay})` }}
            />
          ))}
        </span>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-xl font-bold tracking-tight text-brand-800 md:text-2xl">{APP_NAME}</span>
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
