// Escrituras desde el navegador. Tras cada una, la UI hace router.refresh().
import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import type { Member, MemberInput, PickInput } from "./types";

export class MutationError extends Error {}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  members_name_unique: "Ya hay alguien en el equipo con ese nombre.",
  members_name_length: "El nombre debe tener entre 1 y 40 caracteres.",
  members_avatar_url_format: "La URL de la foto no es válida.",
  daily_picks_date_unique: "Ya hay una canción registrada para este día.",
  daily_picks_no_self_nomination: "No vale autonominarse 😉 Elige a otra persona.",
  daily_picks_url_format: "El enlace debe empezar por http:// o https://",
  daily_picks_title_length: "El título es obligatorio (máx. 200 caracteres).",
  daily_picks_artist_length: "El artista es obligatorio (máx. 200 caracteres).",
  daily_picks_comment_length: "El comentario es demasiado largo (máx. 1000 caracteres).",
  ratings_one_per_member: "Ya habías puntuado esta canción.",
  ratings_score_range: "La puntuación no es válida.",
  ratings_comment_length: "El comentario es demasiado largo (máx. 280 caracteres).",
};

function toMutationError(error: PostgrestError): MutationError {
  const text = `${error.message} ${error.details ?? ""}`;
  const constraint = Object.keys(CONSTRAINT_MESSAGES).find((name) => text.includes(name));
  if (constraint) return new MutationError(CONSTRAINT_MESSAGES[constraint]);
  // P0001 = excepción lanzada por nuestras funciones/triggers, con mensaje ya en castellano.
  if (error.code === "P0001") return new MutationError(error.message);
  return new MutationError(`Algo ha fallado: ${error.message}`);
}

async function run<T>(
  promise: PromiseLike<{ data: T | null; error: PostgrestError | null }>,
): Promise<T> {
  const { data, error } = await promise;
  if (error) throw toMutationError(error);
  return data as T;
}

const MEMBER_COLUMNS = "id, name, emoji, color, avatar_url, has_pin, active, created_at";

export function createMember(input: MemberInput): Promise<Member> {
  return run(
    getSupabase()
      .from("members")
      .insert({ ...input, name: input.name.trim() })
      .select(MEMBER_COLUMNS)
      .single(),
  );
}

export async function updateMember(
  id: string,
  patch: Partial<MemberInput & { active: boolean }>,
): Promise<void> {
  const clean = patch.name === undefined ? patch : { ...patch, name: patch.name.trim() };
  await run(getSupabase().from("members").update(clean).eq("id", id));
}

// ---------------------------------------------------------------------------
// Fotos de perfil (bucket público `avatars`)
// ---------------------------------------------------------------------------

const AVATAR_BUCKET = "avatars";

/** Ruta dentro del bucket a partir de la URL pública, o null si la foto no es nuestra. */
function avatarPath(url: string | null): string | null {
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const index = url ? url.indexOf(marker) : -1;
  return url && index >= 0 ? decodeURIComponent(url.slice(index + marker.length).split("?")[0]) : null;
}

/** Sube (photo) o quita (null) la foto de un miembro y borra la anterior. Devuelve la nueva URL. */
export async function setMemberPhoto(
  member: Pick<Member, "id" | "avatar_url">,
  photo: Blob | null,
): Promise<string | null> {
  const storage = getSupabase().storage.from(AVATAR_BUCKET);
  let url: string | null = null;

  if (photo) {
    const extension = photo.type === "image/webp" ? "webp" : photo.type === "image/png" ? "png" : "jpg";
    // Nombre único: evita cachés viejas y no necesita permisos de sobrescritura.
    const path = `${member.id}/${Date.now()}.${extension}`;
    const { error } = await storage.upload(path, photo, { cacheControl: "31536000", contentType: photo.type });
    if (error) throw new MutationError(`No se pudo subir la foto: ${error.message}`);
    url = storage.getPublicUrl(path).data.publicUrl;
  }

  await run(getSupabase().from("members").update({ avatar_url: url }).eq("id", member.id));

  // Limpieza de la foto anterior: si falla, solo queda un archivo huérfano.
  const previous = avatarPath(member.avatar_url);
  if (previous) await storage.remove([previous]);

  return url;
}

export type MemberDraft = MemberInput & {
  /** URL actual que se quiere conservar (null = sin foto). */
  avatar_url: string | null;
  /** Foto nueva ya procesada, pendiente de subir. */
  photo: Blob | null;
};

/**
 * Crea o actualiza un miembro con su foto. Si el perfil se guarda pero la foto
 * falla, devuelve el miembro igualmente junto al error de la foto.
 */
export async function saveMember(
  draft: MemberDraft,
  existing?: Member,
): Promise<{ member: Member; photoError: string | null }> {
  const fields: MemberInput = { name: draft.name.trim(), emoji: draft.emoji, color: draft.color };
  let member: Member;
  if (existing) {
    await updateMember(existing.id, fields);
    member = { ...existing, ...fields };
  } else {
    member = await createMember(fields);
  }

  const photoChanged = draft.photo !== null || draft.avatar_url !== member.avatar_url;
  if (!photoChanged) return { member, photoError: null };

  try {
    return { member: { ...member, avatar_url: await setMemberPhoto(member, draft.photo) }, photoError: null };
  } catch (error) {
    return { member, photoError: errorMessage(error) };
  }
}

export function verifyPin(memberId: string, pin: string): Promise<boolean> {
  return run(getSupabase().rpc("verify_member_pin", { p_member_id: memberId, p_pin: pin }));
}

/** newPin = null elimina el PIN. Si ya existía uno, hay que dar el actual. */
export async function setPin(
  memberId: string,
  newPin: string | null,
  currentPin: string | null,
): Promise<void> {
  await run(
    getSupabase().rpc("set_member_pin", {
      p_member_id: memberId,
      p_new_pin: newPin,
      p_current_pin: currentPin,
    }),
  );
}

export async function adminClearPin(memberId: string): Promise<void> {
  await run(getSupabase().rpc("admin_clear_member_pin", { p_member_id: memberId }));
}

/** Publica la canción del día y avisa al canal de Teams (si está configurado). */
export async function createPick(input: PickInput & { date: string; presenter_id: string }): Promise<void> {
  const { id } = await run<{ id: string }>(getSupabase().from("daily_picks").insert(input).select("id").single());
  // Sin esperar: si Teams falla, la canción ya está publicada igualmente.
  void fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickId: id }),
  }).catch(() => {});
}

export async function updatePick(id: string, input: PickInput): Promise<void> {
  await run(getSupabase().from("daily_picks").update(input).eq("id", id));
}

export async function createRating(input: {
  daily_pick_id: string;
  member_id: string;
  score: number;
  comment: string | null;
}): Promise<void> {
  await run(getSupabase().from("ratings").insert(input));
}

export function errorMessage(error: unknown): string {
  if (error instanceof MutationError) return error.message;
  if (error instanceof Error) return `Algo ha fallado: ${error.message}`;
  return "Algo ha fallado. Inténtalo de nuevo.";
}
