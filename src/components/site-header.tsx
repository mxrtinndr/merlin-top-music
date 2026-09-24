import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { UserMenu } from "@/components/identity/user-menu";
import { DesktopNav } from "@/components/site-nav";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${APP_NAME}, inicio`}>
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-brand-800 shadow-sm shadow-brand-700/30">
        {/* Mini ecualizador */}
        <span className="flex h-4 items-end gap-[3px]" aria-hidden>
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
        <span className="block font-display text-[17px] font-bold tracking-tight text-brand-800">{APP_NAME}</span>
        <span className="block text-[11px] font-medium text-slate-500">{APP_TAGLINE}</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  // Sin backdrop-blur: crearía un contenedor para los elementos fixed del menú de usuario.
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Logo />
        <DesktopNav />
        <UserMenu />
      </div>
    </header>
  );
}
