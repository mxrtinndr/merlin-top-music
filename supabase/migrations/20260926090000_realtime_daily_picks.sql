-- ============================================================================
-- Merlin FM · La canción del día
-- Migración 4: Realtime para las canciones del día
-- ============================================================================
-- La app escucha los cambios de `daily_picks` para refrescarse sola y avisar
-- (notificación de escritorio) a quien acaban de nominar. RLS ya permite leer
-- la tabla a la clave anónima, que es lo que Realtime necesita.

alter publication supabase_realtime add table public.daily_picks;
