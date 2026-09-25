"use client";

import { createContext, useContext, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { errorMessage, verifyPin, type AdminCredentials } from "@/lib/mutations";
import type { Member } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { MemberAvatar } from "@/components/member-avatar";
import { useIdentity } from "@/components/identity/identity-provider";
import { PinInput } from "@/components/identity/pin-input";
import { PinSettings } from "@/components/identity/pin-settings";

const AdminContext = createContext<AdminCredentials | null>(null);

/** Credenciales del admin que ha desbloqueado el panel. Solo dentro de <AdminGate>. */
export function useAdminCredentials(): AdminCredentials {
  const credentials = useContext(AdminContext);
  if (!credentials) throw new Error("useAdminCredentials debe usarse dentro de <AdminGate>");
  return credentials;
}

/** Nombres de los admins en castellano: "Martín o Sara". */
export function adminNames(members: Member[]): string {
  const names = members.filter((member) => member.is_admin && member.active).map((member) => member.name);
  return new Intl.ListFormat("es", { type: "disjunction" }).format(names);
}

/**
 * Solo deja pasar a admins con PIN, y tras confirmarlo. El PIN se queda en
 * memoria mientras dura la visita: las acciones sensibles lo reenvían y la
 * base de datos lo comprueba de nuevo.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { currentMember, ready } = useIdentity();
  // Guardamos a quién pertenece el PIN: si cambias de persona, se vuelve a pedir.
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);

  if (!ready) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" aria-hidden />;
  if (!currentMember?.is_admin) return <NotAllowed />;
  if (!currentMember.has_pin) return <PinRequired member={currentMember} />;
  if (credentials?.adminId !== currentMember.id) {
    return <Unlock member={currentMember} onUnlock={(pin) => setCredentials({ adminId: currentMember.id, pin })} />;
  }

  return <AdminContext.Provider value={credentials}>{children}</AdminContext.Provider>;
}

function GateCard({ children }: { children: React.ReactNode }) {
  return <Card className="mx-auto max-w-md p-6 text-center sm:p-8">{children}</Card>;
}

function NotAllowed() {
  const { members, currentMember, openPicker } = useIdentity();
  const names = adminNames(members);
  return (
    <GateCard>
      <ShieldCheck className="mx-auto size-10 text-brand-400" />
      <h2 className="mt-3 text-lg font-semibold text-ink">Solo para administración</h2>
      <p className="mt-1 text-sm text-slate-500">
        La gestión del equipo es cosa de las personas administradoras{names && <> ({names})</>}. Si necesitas un
        cambio, pídeselo.
      </p>
      {!currentMember && (
        <Button className="mt-5" onClick={openPicker}>
          ¿Quién eres?
        </Button>
      )}
    </GateCard>
  );
}

function PinRequired({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  return (
    <GateCard>
      <KeyRound className="mx-auto size-10 text-brand-400" />
      <h2 className="mt-3 text-lg font-semibold text-ink">Ponte un PIN para entrar</h2>
      <p className="mt-1 text-sm text-slate-500">
        Eres admin, pero sin PIN cualquiera podría elegir tu nombre y entrar aquí.
      </p>
      <Button className="mt-5" onClick={() => setOpen(true)}>
        <KeyRound className="size-4" /> Añadir PIN
      </Button>
      <PinSettings member={member} open={open} onClose={() => setOpen(false)} />
    </GateCard>
  );
}

function Unlock({ member, onUnlock }: { member: Member; onUnlock: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async (value: string) => {
    setChecking(true);
    setError(null);
    try {
      if (await verifyPin(member.id, value)) {
        onUnlock(value);
      } else {
        setError("PIN incorrecto. Prueba otra vez.");
        setPin("");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  return (
    <GateCard>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (pin.length === 4) check(pin);
        }}
      >
        <MemberAvatar member={member} size="lg" className="mx-auto" />
        <div>
          <h2 className="text-lg font-semibold text-ink">Confirma que eres {member.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Introduce tu PIN para gestionar el equipo.</p>
        </div>
        <PinInput id="admin-pin" label="PIN" value={pin} onChange={setPin} onComplete={check} autoFocus invalid={!!error} />
        <FormError message={error} />
        <Button type="submit" className="w-full" loading={checking} disabled={pin.length !== 4}>
          Entrar
        </Button>
      </form>
    </GateCard>
  );
}
