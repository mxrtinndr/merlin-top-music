import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getMembers } from "@/lib/queries";
import { IdentityProvider } from "@/components/identity/identity-provider";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/site-nav";
import { SetupNotice } from "@/components/setup-notice";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description: `La tradición musical diaria del equipo de ${COMPANY_NAME}: una canción, un voto, un ranking.`,
};

export const viewport: Viewport = {
  themeColor: "#1B3A6B",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection(); // todo es dinámico: los datos cambian cada mañana
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {isSupabaseConfigured ? <App>{children}</App> : <SetupNotice />}
      </body>
    </html>
  );
}

async function loadMembers() {
  try {
    return { members: await getMembers(), error: null };
  } catch (error) {
    unstable_rethrow(error); // deja pasar las señales internas de Next (render dinámico)
    return { members: [], error: error instanceof Error ? error.message : String(error) };
  }
}

async function App({ children }: { children: React.ReactNode }) {
  const { members, error } = await loadMembers();
  if (error) return <SetupNotice error={error} />;
  return (
    <IdentityProvider initialMembers={members}>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:pb-16 md:pt-10">{children}</main>
      <footer className="hidden pb-8 text-center text-xs text-slate-400 md:block">
        Hecho con 🎶 por el equipo de {COMPANY_NAME} · A Coruña
      </footer>
      <MobileNav />
    </IdentityProvider>
  );
}
