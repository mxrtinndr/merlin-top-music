"use client";

import { useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  enableNotifications,
  muteNotifications,
  setNotificationPref,
  showTestNotification,
  useNotificationPrefs,
  useNotificationStatus,
  type NotificationKind,
} from "./notification-store";

const KINDS: { kind: NotificationKind; title: string; description: string }[] = [
  {
    kind: "newPick",
    title: "Nueva canción para puntuar",
    description: "Cuando alguien publica la canción del día.",
  },
  {
    kind: "nomination",
    title: "Cuando me nominen",
    description: "Alguien te elige para recomendar la próxima canción.",
  },
  {
    kind: "turn",
    title: "Cuando me toque",
    description: "El día que te toca poner la canción.",
  },
];

/** Activa o apaga los avisos de escritorio y elige cuáles quieres recibir. */
export function NotificationSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notificaciones"
      description="Avisos de escritorio mientras la app esté abierta, aunque sea en otra pestaña. Se guardan en este navegador."
    >
      {open && <SettingsBody />}
    </Modal>
  );
}

function SettingsBody() {
  const status = useNotificationStatus();
  const prefs = useNotificationPrefs();

  if (status === undefined) return null;

  if (status === "unsupported") {
    return (
      <Notice>Este navegador no permite avisos de escritorio. Prueba con Chrome, Edge, Firefox o Safari en el ordenador.</Notice>
    );
  }

  const on = status === "enabled";

  return (
    <div className="space-y-5">
      {status === "denied" ? (
        <Notice>
          <BellOff className="mt-0.5 size-4 shrink-0 text-slate-400" />
          Los avisos están bloqueados en el navegador. Actívalos desde el candado de la barra de direcciones y vuelve aquí.
        </Notice>
      ) : status === "default" ? (
        <div className="rounded-2xl bg-brand-50 p-4 text-center">
          <p className="text-sm text-brand-900">El navegador te pedirá permiso para mostrar avisos.</p>
          <Button className="mt-3" onClick={() => void enableNotifications()}>
            <Bell className="size-4" /> Activar avisos
          </Button>
        </div>
      ) : (
        <Row
          title="Avisos de escritorio"
          description={on ? "Activados en este navegador." : "Silenciados: no te llegará ninguno."}
          checked={on}
          onChange={() => (on ? muteNotifications() : void enableNotifications())}
          strong
        />
      )}

      <div className={cn("divide-y divide-slate-100 border-t border-slate-100", !on && "opacity-60")}>
        {KINDS.map(({ kind, title, description }) => (
          <Row
            key={kind}
            title={title}
            description={description}
            checked={prefs[kind]}
            onChange={() => setNotificationPref(kind, !prefs[kind])}
            disabled={!on}
          />
        ))}
      </div>

      {on && <TestButton />}
    </div>
  );
}

/** Lanza un aviso al momento para comprobar que el navegador y el sistema los muestran. */
function TestButton() {
  const [result, setResult] = useState<"shown" | "failed" | null>(null);
  return (
    <div className="space-y-2">
      <Button variant="secondary" className="w-full" onClick={() => setResult(showTestNotification() ? "shown" : "failed")}>
        <Send className="size-4" /> Enviar aviso de prueba
      </Button>
      {result === "shown" && (
        <p className="text-center text-xs text-slate-500">
          ¿No lo ves? Revisa que tu navegador tenga permitidas las notificaciones en el sistema (en Windows:
          Configuración → Sistema → Notificaciones) y que no esté activado el modo «No molestar».
        </p>
      )}
      {result === "failed" && (
        <p className="text-center text-xs text-rose-600">
          Este navegador no deja mostrar el aviso desde aquí. En móvil suele pasar: prueba desde el ordenador.
        </p>
      )}
    </div>
  );
}

function Row({
  title,
  description,
  checked,
  onChange,
  disabled,
  strong,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm text-brand-900", strong ? "font-semibold" : "font-medium")}>{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{children}</p>;
}
