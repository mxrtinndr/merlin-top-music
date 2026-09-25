"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellOff, ChevronDown, KeyRound, LogOut, Repeat2, UserPen, Users } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { MemberEditForm } from "@/components/member-edit-form";
import { Modal } from "@/components/ui/modal";
import {
  enableNotifications,
  muteNotifications,
  useNotificationStatus,
} from "@/components/notifications/notification-store";
import { useIdentity } from "./identity-provider";
import { PinSettings } from "./pin-settings";

const ITEM =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-brand-900 transition hover:bg-brand-50";

export function UserMenu() {
  const { currentMember, ready, openPicker, signOut } = useIdentity();
  const [open, setOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (!ready) {
    return <span className="size-10 animate-pulse rounded-full bg-slate-100" aria-hidden />;
  }

  if (!currentMember) {
    return (
      <button
        type="button"
        onClick={openPicker}
        className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-deep-600"
      >
        ¿Quién eres?
      </button>
    );
  }

  const close = () => setOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-surface py-1 pl-1 pr-2.5 transition hover:border-brand-200"
      >
        <MemberAvatar member={currentMember} size="sm" />
        <span className="max-w-28 truncate text-sm font-semibold text-brand-900">{currentMember.name}</span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-slate-200/70 bg-surface p-1.5 shadow-lift animate-pop"
          >
            <p className="px-3 pb-1.5 pt-2 text-xs text-slate-500">
              Estás como <strong className="text-brand-900">{currentMember.name}</strong>
            </p>
            <button type="button" role="menuitem" className={ITEM} onClick={() => { close(); setProfileOpen(true); }}>
              <UserPen className="size-4 text-brand-500" /> Editar mi perfil
            </button>
            <button type="button" role="menuitem" className={ITEM} onClick={() => { close(); openPicker(); }}>
              <Repeat2 className="size-4 text-brand-500" /> Cambiar de persona
            </button>
            <button type="button" role="menuitem" className={ITEM} onClick={() => { close(); setPinOpen(true); }}>
              <KeyRound className="size-4 text-brand-500" /> {currentMember.has_pin ? "Cambiar PIN" : "Añadir PIN"}
            </button>
            <NotificationsItem onDone={close} />
            <Link href="/admin" role="menuitem" className={ITEM} onClick={close}>
              <Users className="size-4 text-brand-500" /> Gestionar equipo
            </Link>
            <div className="my-1 h-px bg-slate-100" />
            <button type="button" role="menuitem" className={ITEM} onClick={() => { close(); signOut(); }}>
              <LogOut className="size-4 text-slate-400" /> Salir
            </button>
          </div>
        </>
      )}

      <PinSettings member={currentMember} open={pinOpen} onClose={() => setPinOpen(false)} />
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Mi perfil" description="Tu foto, nombre y color para el resto del equipo.">
        {profileOpen && <MemberEditForm member={currentMember} onDone={() => setProfileOpen(false)} />}
      </Modal>
    </div>
  );
}

/** Activa o silencia los avisos de escritorio (p. ej. cuando te nominan). */
function NotificationsItem({ onDone }: { onDone: () => void }) {
  const status = useNotificationStatus();
  if (status === undefined || status === "unsupported") return null;

  if (status === "denied") {
    return (
      <p className="flex items-start gap-2.5 px-3 py-2.5 text-xs text-slate-500">
        <BellOff className="mt-0.5 size-4 shrink-0 text-slate-400" />
        Avisos bloqueados. Actívalos en el candado de la barra de direcciones.
      </p>
    );
  }

  if (status === "enabled") {
    return (
      <button type="button" role="menuitem" className={ITEM} onClick={() => { muteNotifications(); onDone(); }}>
        <BellOff className="size-4 text-brand-500" /> Silenciar avisos
      </button>
    );
  }

  return (
    <button type="button" role="menuitem" className={ITEM} onClick={() => { void enableNotifications(); onDone(); }}>
      <Bell className="size-4 text-brand-500" /> Avisarme cuando me nominen
    </button>
  );
}
