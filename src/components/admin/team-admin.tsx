"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pencil, Plus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminClearPin, errorMessage, saveMember, updateMember } from "@/lib/mutations";
import type { Member } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ShowMoreList } from "@/components/ui/show-more";
import { MemberAvatar } from "@/components/member-avatar";
import { MemberEditForm } from "@/components/member-edit-form";
import { emptyMemberValue, MemberFields, toDraft, type MemberFormValue } from "@/components/member-fields";
import { useIdentity } from "@/components/identity/identity-provider";
import { useAdminCredentials } from "./admin-gate";

const EMPTY = emptyMemberValue({ emoji: "🎧", color: "#0470B3" });

export function TeamAdmin() {
  const { members, currentMember } = useIdentity();
  const [editing, setEditing] = useState<Member | null>(null);
  const active = members.filter((member) => member.active);
  const inactive = members.filter((member) => !member.active);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <AddMemberCard />

      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <CardHeader title="En activo" subtitle={`${active.length} personas`} className="mb-3" />
          <MemberRows members={active} currentId={currentMember?.id} onEdit={setEditing} />
        </Card>

        {inactive.length > 0 && (
          <Card className="p-5 sm:p-6">
            <CardHeader
              title="Inactivos"
              subtitle="No aparecen en los selectores, pero conservan su histórico y su sitio en el ranking."
              className="mb-3"
            />
            <MemberRows members={inactive} currentId={currentMember?.id} onEdit={setEditing} />
          </Card>
        )}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Editar miembro">
        {editing && <MemberEditForm key={editing.id} member={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}

function useSaving() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await action();
      startRefresh(() => router.refresh());
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { run, busy: saving || refreshing, error };
}

function AddMemberCard() {
  const [value, setValue] = useState<MemberFormValue>(EMPTY);
  const { run, busy, error } = useSaving();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader title="Añadir al equipo" subtitle="También pueden añadirse solos la primera vez que entren." className="mb-5" />
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!value.name.trim()) return;
          setNotice(null);
          const saved = await run(async () => {
            const { member, photoError } = await saveMember(toDraft(value));
            // El perfil ya existe: avisamos de la foto pero no bloqueamos el alta.
            if (photoError) setNotice(`${member.name} ya está en el equipo, pero sin foto: ${photoError}`);
          });
          if (saved) setValue(EMPTY);
        }}
      >
        <MemberFields idPrefix="admin-new" value={value} onChange={setValue} />
        <FormError message={error ?? notice} />
        <Button type="submit" className="w-full" loading={busy} disabled={!value.name.trim()}>
          <Plus className="size-4" /> Añadir
        </Button>
      </form>
    </Card>
  );
}

function MemberRows({
  members,
  currentId,
  onEdit,
}: {
  members: Member[];
  currentId: string | undefined;
  onEdit: (member: Member) => void;
}) {
  if (members.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">Nadie por aquí todavía.</p>;
  }
  return (
    <ShowMoreList items={members}>
      {(visible) => (
        <ul className="divide-y divide-slate-100">
          {visible.map((member) => (
            <MemberRow key={member.id} member={member} isMe={member.id === currentId} onEdit={() => onEdit(member)} />
          ))}
        </ul>
      )}
    </ShowMoreList>
  );
}

function MemberRow({ member, isMe, onEdit }: { member: Member; isMe: boolean; onEdit: () => void }) {
  const admin = useAdminCredentials();
  const { run, busy, error } = useSaving();

  const toggleActive = () => {
    if (member.active && !window.confirm(`¿Desactivar el perfil de ${member.name}? Podrás reactivarlo cuando quieras.`)) return;
    run(() => updateMember(member.id, { active: !member.active }));
  };

  const clearPin = () => {
    if (!window.confirm(`¿Quitar el PIN de ${member.name}?`)) return;
    run(() => adminClearPin(admin, member.id));
  };

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <MemberAvatar member={member} size="md" className={cn(!member.active && "opacity-50 grayscale")} />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-semibold", member.active ? "text-brand-900" : "text-slate-400")}>
            {member.name}
            {isMe && <span className="ml-1.5 text-xs font-medium text-brand-500">(tú)</span>}
            {member.is_admin && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-xs font-medium text-slate-500">
                <ShieldCheck className="size-3" /> Admin
              </span>
            )}
          </p>
          {member.has_pin && (
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <KeyRound className="size-3" /> Con PIN ·
              <button
                type="button"
                onClick={clearPin}
                disabled={busy}
                className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
              >
                Quitar
              </button>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Editar a ${member.name}`}>
            <Pencil className="size-3.5" />
          </Button>
          <Switch checked={member.active} onChange={toggleActive} disabled={busy} label={`${member.name} activo`} />
        </div>
      </div>
      {error && <FormError message={error} />}
    </li>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative ml-1 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-brand-500" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 size-5 rounded-full bg-surface shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
