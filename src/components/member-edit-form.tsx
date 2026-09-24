"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, saveMember } from "@/lib/mutations";
import type { Member } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { MemberFields, memberToValue, toDraft, type MemberFormValue } from "@/components/member-fields";

/** Editar nombre, foto, emoji y color de un miembro. Lo usan "Mi perfil" y /admin. */
export function MemberEditForm({ member, onDone }: { member: Member; onDone: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState<MemberFormValue>(() => memberToValue(member));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!value.name.trim()) return setError("El nombre no puede quedar vacío.");
        setSaving(true);
        setError(null);
        try {
          const { photoError } = await saveMember(toDraft(value), member);
          startRefresh(() => router.refresh());
          if (photoError) setError(photoError);
          else onDone();
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      <MemberFields idPrefix={`edit-${member.id}`} value={value} onChange={setValue} />
      <FormError message={error} />
      <Button type="submit" className="w-full" loading={saving || refreshing} disabled={!value.name.trim()}>
        Guardar
      </Button>
    </form>
  );
}
