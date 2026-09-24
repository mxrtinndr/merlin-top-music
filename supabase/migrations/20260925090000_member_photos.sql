-- ============================================================================
-- Merlin FM · La canción del día
-- Migración 3: foto de perfil de los miembros (Supabase Storage)
-- ============================================================================
-- La foto se redimensiona en el navegador (cuadrada, ~320 px, WebP/JPEG) y se
-- sube al bucket público `avatars`. En `members.avatar_url` guardamos su URL
-- pública. El emoji se queda como respaldo para quien no tenga foto.

alter table public.members
  add column avatar_url text,
  add constraint members_avatar_url_format check (avatar_url is null or avatar_url ~* '^https?://\S+$');

grant insert (avatar_url) on public.members to anon, authenticated;
grant update (avatar_url) on public.members to anon, authenticated;

-- ----------------------------------------------------------------------------
-- El ranking también devuelve la foto (cambia el tipo de retorno: hay que recrearla)
-- ----------------------------------------------------------------------------
drop function public.get_leaderboard(date, date);

create function public.get_leaderboard(p_from date default null, p_to date default null)
returns table (
  member_id      uuid,
  name           text,
  emoji          text,
  color          text,
  avatar_url     text,
  active         boolean,
  picks_count    int,
  ratings_count  int,
  avg_score      float8,
  last_pick_date date
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    m.id,
    m.name,
    m.emoji,
    m.color,
    m.avatar_url,
    m.active,
    count(distinct p.id)::int,
    count(r.id)::int,
    round(avg(r.score)::numeric, 2)::float8,
    max(p.date)
  from public.members m
  left join public.daily_picks p
    on p.presenter_id = m.id
   and (p_from is null or p.date >= p_from)
   and (p_to   is null or p.date <= p_to)
  left join public.ratings r on r.daily_pick_id = p.id
  group by m.id
  having m.active or count(p.id) > 0
  order by avg(r.score) desc nulls last, count(r.id) desc, count(distinct p.id) desc, m.name;
$$;

grant execute on function public.get_leaderboard(date, date) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Bucket de fotos: público para lectura, máx. 1 MB, solo imágenes
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Sin login: cualquiera con la app puede subir y borrar fotos de este bucket.
-- (select es necesario para que Storage permita borrar la foto anterior).
create policy "avatars_select" on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');
create policy "avatars_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'avatars');
create policy "avatars_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'avatars');
