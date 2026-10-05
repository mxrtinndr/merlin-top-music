import type { Metadata } from "next";
import { todayISO } from "@/lib/dates";
import { getHolidays } from "@/lib/queries";
import { Eyebrow } from "@/components/ui/card";
import { AdminGate } from "@/components/admin/admin-gate";
import { HolidayAdmin } from "@/components/admin/holiday-admin";
import { TeamAdmin } from "@/components/admin/team-admin";

export const metadata: Metadata = { title: "Equipo" };

export default async function AdminPage() {
  // Festivos de este año en adelante: los próximos y los que ya pasaron.
  const today = todayISO();
  const holidays = await getHolidays(`${today.slice(0, 4)}-01-01`);
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Administración</Eyebrow>
        <h1 className="mt-1 text-3xl font-bold text-brand-800 sm:text-4xl">El equipo</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Solo para administración: altas, nombres, emojis, PIN olvidados y días festivos.
        </p>
      </div>
      <AdminGate>
        <div className="space-y-10">
          <TeamAdmin />
          <section className="space-y-4" aria-labelledby="holidays-title">
            <div>
              <Eyebrow>Calendario</Eyebrow>
              <h2 id="holidays-title" className="mt-1 text-2xl font-bold text-brand-800">
                Días festivos
              </h2>
            </div>
            <HolidayAdmin holidays={holidays} today={today} />
          </section>
        </div>
      </AdminGate>
    </div>
  );
}
