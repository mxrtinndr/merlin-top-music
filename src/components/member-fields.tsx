"use client";

import { useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import { MEMBER_COLORS, MEMBER_EMOJIS } from "@/lib/config";
import { cn } from "@/lib/cn";
import { processAvatar, type ProcessedPhoto } from "@/lib/image";
import type { MemberDraft } from "@/lib/mutations";
import type { Member, MemberInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { MemberAvatar } from "@/components/member-avatar";

/** Estado del formulario de miembro: datos + foto actual o nueva pendiente de subir. */
export type MemberFormValue = MemberInput & {
  avatar_url: string | null;
  photo: ProcessedPhoto | null;
};

export function randomMemberLook(): Pick<MemberInput, "emoji" | "color"> {
  return {
    emoji: MEMBER_EMOJIS[Math.floor(Math.random() * MEMBER_EMOJIS.length)],
    color: MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)],
  };
}

export function emptyMemberValue(look: Pick<MemberInput, "emoji" | "color">): MemberFormValue {
  return { name: "", ...look, avatar_url: null, photo: null };
}

export function memberToValue(member: Member): MemberFormValue {
  const { name, emoji, color, avatar_url } = member;
  return { name, emoji, color, avatar_url, photo: null };
}

export function toDraft(value: MemberFormValue): MemberDraft {
  return { name: value.name, emoji: value.emoji, color: value.color, avatar_url: value.avatar_url, photo: value.photo?.blob ?? null };
}

/** Foto + nombre + emoji + color. Controlado: lo usan el alta en el selector, el perfil y /admin. */
export function MemberFields({
  idPrefix,
  value,
  onChange,
  autoFocus,
}: {
  idPrefix: string;
  value: MemberFormValue;
  onChange: (value: MemberFormValue) => void;
  autoFocus?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const previewUrl = value.photo?.previewUrl ?? value.avatar_url;
  const hasPhoto = previewUrl !== null;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setProcessing(true);
    setPhotoError(null);
    try {
      onChange({ ...value, photo: await processAvatar(file) });
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "No se pudo usar esa imagen.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="group relative shrink-0 rounded-full"
          aria-label={hasPhoto ? "Cambiar foto" : "Subir foto"}
        >
          <MemberAvatar
            member={{ ...value, name: value.name || "?", avatar_url: previewUrl }}
            size="xl"
            className="transition group-hover:brightness-95"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full bg-brand-500 text-white shadow-md ring-2 ring-white transition group-hover:bg-brand-600">
            {processing ? <LoaderCircle className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <Field label="Nombre" htmlFor={`${idPrefix}-name`}>
            <Input
              id={`${idPrefix}-name`}
              value={value.name}
              onChange={(event) => onChange({ ...value, name: event.target.value })}
              maxLength={40}
              placeholder="Ej.: Ana"
              autoFocus={autoFocus}
              autoComplete="off"
              required
            />
          </Field>
          <div className="flex flex-wrap gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => fileInput.current?.click()} disabled={processing}>
              <Camera className="size-3.5" /> {hasPhoto ? "Cambiar foto" : "Subir foto"}
            </Button>
            {hasPhoto && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => onChange({ ...value, avatar_url: null, photo: null })}
              >
                <Trash2 className="size-3.5" /> Quitar
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            pickPhoto(event.target.files?.[0]);
            event.target.value = ""; // permite volver a elegir el mismo archivo
          }}
        />
      </div>
      {photoError && <p className="text-sm text-rose-600">{photoError}</p>}

      <fieldset>
        <legend className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-brand-900">
          Emoji
          <span className="text-xs font-normal text-slate-400">{hasPhoto ? "se usa si quitas la foto" : "si no subes foto"}</span>
        </legend>
        <div className={cn("grid grid-cols-10 gap-1 transition", hasPhoto && "opacity-60")}>
          {MEMBER_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange({ ...value, emoji })}
              aria-pressed={value.emoji === emoji}
              aria-label={`Emoji ${emoji}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg text-lg transition",
                value.emoji === emoji ? "bg-brand-100 ring-2 ring-brand-500" : "hover:bg-slate-100",
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-brand-900">Color</legend>
        <div className="flex flex-wrap gap-2">
          {MEMBER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...value, color })}
              aria-pressed={value.color === color}
              aria-label={`Color ${color}`}
              className={cn(
                "size-8 rounded-full transition",
                value.color === color ? "ring-2 ring-offset-2" : "hover:scale-110",
              )}
              style={{ backgroundColor: color, ["--tw-ring-color" as string]: color }}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
