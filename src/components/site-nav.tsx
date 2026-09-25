"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Disc3, History, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useIdentity } from "@/components/identity/identity-provider";

const LINKS = [
  { href: "/", label: "Hoy", icon: Disc3 },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Navegación de escritorio, dentro de la cabecera. */
export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "relative rounded-full px-4 py-2 text-[15px] font-semibold transition-all duration-200",
            isActive(pathname, href)
              ? "bg-surface text-brand-700 shadow-card"
              : "text-slate-500 hover:-translate-y-px hover:bg-surface/70 hover:text-brand-700",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior en móvil: al pulgar, que se puntúa con el café en la mano. */
export function MobileNav() {
  const pathname = usePathname();
  const { currentMember } = useIdentity();
  // La pestaña Equipo solo la ven los admins.
  const links = currentMember?.is_admin ? [...LINKS, { href: "/admin", label: "Equipo", icon: Users }] : LINKS;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Principal"
    >
      <ul className={cn("mx-auto grid max-w-lg", links.length === 5 ? "grid-cols-5" : "grid-cols-4")}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition",
                  active ? "text-brand-600" : "text-slate-400",
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.4]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
