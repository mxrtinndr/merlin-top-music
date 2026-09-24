import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | undefined;

/** Cliente único (servidor y navegador). No hay sesión: todo va con la clave anónima. */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa tu .env.local.",
    );
  }
  client ??= createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
