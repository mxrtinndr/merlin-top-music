-- ============================================================================
-- Merlin FM · Miembros de ejemplo
-- ============================================================================
-- ⚠️  Son nombres de relleno. Sustitúyelos por el equipo real antes de
--     ejecutar este archivo, o sáltatelo y da de alta a la gente desde /admin
--     (o dejando que cada persona se añada la primera vez que entra).
--
-- Es idempotente: si un nombre ya existe, no lo duplica.

insert into public.members (name, emoji, color) values
  ('Martín',    '🎧', '#2E6FF2'),
  ('Adrián',  '🎸', '#1E4C8C'),
  ('Claudia RRHH',  '🎹', '#0EA5E9'),
  ('Carmen RRHH',  '🥁', '#14B8A6'),
  ('Jorge',  '🎷', '#8B5CF6'),
  ('Sara',   '🎺', '#F59E0B'),
  ('Mar',  '🎤', '#F43F5E'),
  ('Clara',  '🎻', '#F97316'),
  ('Jacobo',  '🎼', '#FACC15'),
  ('Claudia',  '🎹', '#10B981')
on conflict ((lower(btrim(name)))) do nothing;
