"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Send } from "lucide-react";
import { createPick, errorMessage, updatePick } from "@/lib/mutations";
import { detectProvider, getSongEmbed, isHttpUrl, PROVIDER_LABELS } from "@/lib/music";
import type { DailyPick, Member, PickInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { useIdentity } from "@/components/identity/identity-provider";

type Props =
  | { mode: "create"; date: string; presenter: Member; onDone?: () => void }
  | { mode: "edit"; pick: DailyPick; presenter: Member; onDone?: () => void };

function initialValues(props: Props): PickInput {
  if (props.mode === "edit") {
    const { song_title, song_artist, song_url, presenter_comment, next_presenter_id } = props.pick;
    return { song_title, song_artist, song_url, presenter_comment, next_presenter_id };
  }
  return { song_title: "", song_artist: "", song_url: "", presenter_comment: "", next_presenter_id: "" };
}

function validate(values: PickInput, presenterId: string): string | null {
  if (!values.song_title.trim()) return "Falta el título de la canción.";
  if (!values.song_artist.trim()) return "Falta el artista.";
  if (values.song_url?.trim() && !isHttpUrl(values.song_url)) return "El enlace no parece válido (debe empezar por https://).";
  if (!values.next_presenter_id) return "Elige quién presenta en el siguiente turno.";
  if (values.next_presenter_id === presenterId) return "No vale autonominarse 😉";
  return null;
}

function normalize(values: PickInput): PickInput {
  return {
    song_title: values.song_title.trim(),
    song_artist: values.song_artist.trim(),
    song_url: values.song_url?.trim() || null,
    presenter_comment: values.presenter_comment?.trim() || null,
    next_presenter_id: values.next_presenter_id,
  };
}

export function PickForm(props: Props) {
  const router = useRouter();
  const { activeMembers } = useIdentity();
  const [values, setValues] = useState<PickInput>(() => initialValues(props));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const set = <K extends keyof PickInput>(key: K, value: PickInput[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const candidates = activeMembers.filter((member) => member.id !== props.presenter.id);
  const url = values.song_url?.trim() ?? "";
  const provider = url && isHttpUrl(url) ? detectProvider(url) : null;
  const embeddable = provider ? getSongEmbed(url) !== null : false;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validate(values, props.presenter.id);
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    try {
      if (props.mode === "create") {
        await createPick({ ...normalize(values), date: props.date, presenter_id: props.presenter.id });
      } else {
        await updatePick(props.pick.id, normalize(values));
      }
      startRefresh(() => router.refresh());
      props.onDone?.();
    } catch (err) {
      setError(errorMessage(err));
      startRefresh(() => router.refresh()); // p. ej. si otra persona ya registró la canción de hoy
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Canción" htmlFor="pick-title">
          <Input
            id="pick-title"
            value={values.song_title}
            onChange={(event) => set("song_title", event.target.value)}
            placeholder="Bohemian Rhapsody"
            maxLength={200}
            required
          />
        </Field>
        <Field label="Artista" htmlFor="pick-artist">
          <Input
            id="pick-artist"
            value={values.song_artist}
            onChange={(event) => set("song_artist", event.target.value)}
            placeholder="Queen"
            maxLength={200}
            required
          />
        </Field>
      </div>

      <Field
        label="Enlace"
        htmlFor="pick-url"
        optional
        hint={
          provider && provider !== "other" ? (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <Check className="size-3.5" />
              {embeddable
                ? `${PROVIDER_LABELS[provider]}: se verá el reproductor integrado`
                : `${PROVIDER_LABELS[provider]}: se mostrará como enlace`}
            </span>
          ) : (
            "Pega un enlace de Spotify o YouTube y se verá el reproductor."
          )
        }
      >
        <Input
          id="pick-url"
          type="url"
          inputMode="url"
          value={values.song_url ?? ""}
          onChange={(event) => set("song_url", event.target.value)}
          placeholder="https://open.spotify.com/track/…"
        />
      </Field>

      <Field label="¿Por qué esta canción?" htmlFor="pick-comment" optional>
        <Textarea
          id="pick-comment"
          value={values.presenter_comment ?? ""}
          onChange={(event) => set("presenter_comment", event.target.value)}
          placeholder="La historia detrás, un recuerdo, o simplemente que es un temazo…"
          maxLength={1000}
        />
      </Field>

      <Field
        label="¿Quién presenta en el siguiente turno?"
        htmlFor="pick-next"
        hint="Le aparecerá en la portada para que vaya preparando su canción."
      >
        <Select
          id="pick-next"
          value={values.next_presenter_id}
          onChange={(event) => set("next_presenter_id", event.target.value)}
          required
        >
          <option value="" disabled>
            Elige a alguien del equipo…
          </option>
          {candidates.map((member) => (
            <option key={member.id} value={member.id}>
              {member.emoji} {member.name}
            </option>
          ))}
        </Select>
      </Field>

      <FormError message={error} />

      <Button type="submit" size="lg" className="w-full" loading={saving || refreshing}>
        {props.mode === "create" ? (
          <>
            <Send className="size-4" /> Publicar la canción del día
          </>
        ) : (
          "Guardar cambios"
        )}
      </Button>
    </form>
  );
}
