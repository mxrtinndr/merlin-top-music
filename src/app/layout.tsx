import type { Metadata, Viewport } from "next";
import { Inter, Rubik } from "next/font/google";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/supabase";
import { todayISO } from "@/lib/dates";
import { getLatestPick, getMembers } from "@/lib/queries";
import { IdentityProvider } from "@/components/identity/identity-provider";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/site-nav";
import { SetupNotice } from "@/components/setup-notice";
import { SiteFooter } from "@/components/site-footer";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme";
import { NominationNotifier } from "@/components/notifications/nomination-notifier";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Tipografías del manual de estilo: Rubik (corporativa) e Inter (secundaria).
const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description: `La tradición musical diaria del equipo de ${COMPANY_NAME}: una canción, un voto, un ranking.`,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00416A" },
    { media: "(prefers-color-scheme: dark)", color: "#0E171D" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection(); // todo es dinámico: los datos cambian cada mañana
  return (
    // suppressHydrationWarning: el script del tema añade la clase "dark" antes de hidratar.
    <html lang="es" className={`${inter.variable} ${rubik.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* En línea y en <head>: se ejecuta antes de pintar, así no hay destello del tema claro. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {isSupabaseConfigured ? <App>{children}</App> : <SetupNotice />}
      </body>
    </html>
  );
}

async function loadData() {
  try {
    const [members, latestPick] = await Promise.all([getMembers(), getLatestPick()]);
    return { members, latestPick, error: null };
  } catch (error) {
    unstable_rethrow(error); // deja pasar las señales internas de Next (render dinámico)
    return { members: [], latestPick: null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function App({ children }: { children: React.ReactNode }) {
  const { members, latestPick, error } = await loadData();
  if (error) return <SetupNotice error={error} />;
  // Si la última canción es de un día anterior, hoy le toca a quien nominó.
  const turnMemberId = latestPick && latestPick.date < todayISO() ? latestPick.next_presenter_id : null;
  return (
    <IdentityProvider initialMembers={members}>
      <NominationNotifier
        latestPick={
          latestPick && {
            id: latestPick.id,
            presenter_id: latestPick.presenter_id,
            next_presenter_id: latestPick.next_presenter_id,
          }
        }
      />
      <SiteHeader turnMemberId={turnMemberId} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-6 md:pb-16 md:pt-8">{children}</main>
      <SiteFooter />
      <MobileNav />
    </IdentityProvider>
  );
}
