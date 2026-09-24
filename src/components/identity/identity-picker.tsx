"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Search, UserPlus } from "lucide-react";
import { errorMessage, saveMember, verifyPin } from "@/lib/mutations";
import type { Member } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/field";
import { MemberAvatar } from "@/components/member-avatar";
import { emptyMemberValue, MemberFields, randomMemberLook, toDraft, type MemberFormValue } from "@/components/member-fields";
import { PinInput } from "./pin-input";
import { useIdentity } from "./identity-provider";

type Step = { kind: "list" } | { kind: "pin"; member: Member } | { kind: "new" };

export function IdentityPicker({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "list" });

  const titles: Record<Step["kind"], { title: string; description: string }> = {
    list: { title: "¿Quién eres?", description: "Elige tu nombre para presentar y puntuar canciones." },
    pin: { title: "Introduce tu PIN", description: "Este perfil está protegido con un PIN de 4 dígitos." },
    new: { title: "¡Te damos la bienvenida!", description: "Crea tu perfil en un momento." },
  };

  return (
    <Modal open onClose={onClose} {...titles[step.kind]}>
      {step.kind === "list" && (
        <MemberList onPin={(member) => setStep({ kind: "pin", member })} onNew={() => setStep({ kind: "new" })} />
      )}
      {step.kind === "pin" && <PinStep member={step.member} onBack={() => setStep({ kind: "list" })} />}
      {step.kind === "new" && <NewMemberStep onBack={() => setStep({ kind: "list" })} />}
    </Modal>
  );
}

function MemberList({ onPin, onNew }: { onPin: (member: Member) => void; onNew: () => void }) {
  const { activeMembers, currentMember, selectMember } = useIdentity();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("es");
  const visible = normalized
    ? activeMembers.filter((member) => member.name.toLocaleLowerCase("es").includes(normalized))
    : activeMembers;

  return (
    <div className="space-y-4">
      {activeMembers.length > 8 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca tu nombre"
            className="pl-10"
            aria-label="Buscar miembro"
          />
        </div>
      )}

      {visible.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visible.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => (member.has_pin ? onPin(member) : selectMember(member))}
                className={
                  "flex w-full flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-sm font-medium transition " +
                  (member.id === currentMember?.id
                    ? "border-brand-400 bg-brand-50 text-brand-800"
                    : "border-slate-200 text-brand-900 hover:border-brand-200 hover:bg-brand-50/60")
                }
              >
                <MemberAvatar member={member} size="md" />
                <span className="flex max-w-full items-center gap-1 truncate">
                  {member.name}
                  {member.has_pin && <Lock className="size-3 shrink-0 text-slate-400" aria-label="Con PIN" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {activeMembers.length === 0 ? "Aún no hay nadie en el equipo. ¡Sé la primera persona!" : "Nadie con ese nombre."}
        </p>
      )}

      <Button variant="secondary" className="w-full" onClick={onNew}>
        <UserPlus className="size-4" /> Es mi primera vez
      </Button>
    </div>
  );
}

function PinStep({ member, onBack }: { member: Member; onBack: () => void }) {
  const { selectMember } = useIdentity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async (value: string) => {
    setChecking(true);
    setError(null);
    try {
      if (await verifyPin(member.id, value)) {
        selectMember(member);
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
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (pin.length === 4) check(pin);
      }}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
        <MemberAvatar member={member} size="md" />
        <span className="font-semibold text-brand-900">{member.name}</span>
      </div>
      <PinInput id="identity-pin" label="PIN" value={pin} onChange={setPin} onComplete={check} autoFocus invalid={!!error} />
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Volver
        </Button>
        <Button type="submit" className="flex-1" loading={checking} disabled={pin.length !== 4}>
          Entrar
        </Button>
      </div>
      <p className="text-center text-xs text-slate-400">¿Lo has olvidado? Cualquiera puede quitarlo desde Equipo.</p>
    </form>
  );
}

function NewMemberStep({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { selectMember } = useIdentity();
  const [value, setValue] = useState<MemberFormValue>(() => emptyMemberValue(randomMemberLook()));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!value.name.trim()) return setError("Escribe tu nombre.");
        setSaving(true);
        setError(null);
        try {
          const { member, photoError } = await saveMember(toDraft(value));
          selectMember(member);
          router.refresh();
          if (photoError) {
            window.alert(`Tu perfil está creado, pero la foto no se pudo subir (${photoError}). Puedes volver a intentarlo desde tu menú → Editar mi perfil.`);
          }
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      <MemberFields idPrefix="new-member" value={value} onChange={setValue} autoFocus />
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Volver
        </Button>
        <Button type="submit" className="flex-1" loading={saving}>
          Crear mi perfil
        </Button>
      </div>
    </form>
  );
}
