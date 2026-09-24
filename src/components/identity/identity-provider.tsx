"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Member } from "@/lib/types";
import { useStoredMemberId, writeStoredMemberId } from "./identity-store";
import { IdentityPicker } from "./identity-picker";

type IdentityContextValue = {
  /** Todos los miembros, incluidos inactivos (para pintar el histórico). */
  members: Member[];
  activeMembers: Member[];
  memberById: (id: string | null | undefined) => Member | undefined;
  currentMember: Member | null;
  /** false hasta leer localStorage en el cliente. */
  ready: boolean;
  selectMember: (member: Member) => void;
  signOut: () => void;
  openPicker: () => void;
};

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({
  initialMembers,
  children,
}: {
  initialMembers: Member[];
  children: React.ReactNode;
}) {
  const storedId = useStoredMemberId();
  // Miembros creados en esta sesión que aún no han llegado vía router.refresh().
  const [createdMembers, setCreatedMembers] = useState<Member[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const members = useMemo(() => {
    const known = new Set(initialMembers.map((member) => member.id));
    return [...initialMembers, ...createdMembers.filter((member) => !known.has(member.id))].sort(
      (a, b) => a.name.localeCompare(b.name, "es"),
    );
  }, [initialMembers, createdMembers]);

  const byId = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const memberById = useCallback((id: string | null | undefined) => (id ? byId.get(id) : undefined), [byId]);

  const ready = storedId !== undefined;
  const stored = memberById(storedId);
  const currentMember = stored?.active ? stored : null;

  const selectMember = useCallback((member: Member) => {
    setCreatedMembers((previous) =>
      previous.some((m) => m.id === member.id) ? previous : [...previous, member],
    );
    writeStoredMemberId(member.id);
    setPickerOpen(false);
  }, []);

  const signOut = useCallback(() => {
    writeStoredMemberId(null);
    setDismissed(false);
  }, []);

  const value = useMemo<IdentityContextValue>(
    () => ({
      members,
      activeMembers: members.filter((member) => member.active),
      memberById,
      currentMember,
      ready,
      selectMember,
      signOut,
      openPicker: () => setPickerOpen(true),
    }),
    [members, memberById, currentMember, ready, selectMember, signOut],
  );

  // Primera visita: pedimos identidad, pero se puede cerrar para solo mirar.
  const showPicker = pickerOpen || (ready && !currentMember && !dismissed);

  return (
    <IdentityContext.Provider value={value}>
      {children}
      {/* Montado solo al abrir: cada apertura empieza en la lista. */}
      {showPicker && (
        <IdentityPicker
          onClose={() => {
            setPickerOpen(false);
            setDismissed(true);
          }}
        />
      )}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (!context) throw new Error("useIdentity debe usarse dentro de <IdentityProvider>");
  return context;
}
