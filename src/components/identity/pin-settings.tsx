"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, setPin } from "@/lib/mutations";
import type { Member } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { PinInput } from "./pin-input";

export function PinSettings({ member, open, onClose }: { member: Member; open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member.has_pin ? "Tu PIN" : "Protege tu perfil"}
      description={
        member.has_pin
          ? "Cámbialo o quítalo. Necesitas el PIN actual."
          : "Opcional: con un PIN de 4 dígitos nadie más podrá entrar con tu nombre."
      }
    >
      {/* key: reinicia el formulario cada vez que se abre */}
      {open && <PinSettingsForm key={String(member.has_pin)} member={member} onDone={onClose} />}
    </Modal>
  );
}

function PinSettingsForm({ member, onDone }: { member: Member; onDone: () => void }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"save" | "remove" | null>(null);

  const submit = async (newPin: string | null) => {
    setSaving(newPin ? "save" : "remove");
    setError(null);
    try {
      await setPin(member.id, newPin, member.has_pin ? current : null);
      router.refresh();
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const currentMissing = member.has_pin && current.length !== 4;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(next);
      }}
    >
      {member.has_pin && (
        <Field label="PIN actual" htmlFor="pin-current">
          <PinInput id="pin-current" label="PIN actual" value={current} onChange={setCurrent} autoFocus />
        </Field>
      )}
      <Field label={member.has_pin ? "Nuevo PIN" : "PIN"} htmlFor="pin-new">
        <PinInput id="pin-new" label="Nuevo PIN" value={next} onChange={setNext} autoFocus={!member.has_pin} />
      </Field>
      <FormError message={error} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {member.has_pin && (
          <Button
            type="button"
            variant="danger"
            loading={saving === "remove"}
            disabled={currentMissing || saving !== null}
            onClick={() => submit(null)}
          >
            Quitar PIN
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1"
          loading={saving === "save"}
          disabled={next.length !== 4 || currentMissing || saving !== null}
        >
          Guardar PIN
        </Button>
      </div>
    </form>
  );
}
