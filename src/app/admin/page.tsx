import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/card";
import { TeamAdmin } from "@/components/admin/team-admin";

export const metadata: Metadata = { title: "Equipo" };

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Administración</Eyebrow>
        <h1 className="mt-1 text-3xl font-bold text-brand-800 sm:text-4xl">El equipo</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Aquí gestionas quién participa en la tradición: altas, nombres, emojis y PIN olvidados.
        </p>
      </div>
      <TeamAdmin />
    </div>
  );
}
