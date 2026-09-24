-- ============================================================================
-- Merlin FM · La canción del día
-- Migración 2/2: vista de resumen, ranking y gestión de PIN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- daily_picks_summary: cada canción con su nota media y nº de votos
-- ----------------------------------------------------------------------------
create view public.daily_picks_summary
with (security_invoker = true) as
select
  p.id,
  p.date,
  p.presenter_id,
  p.song_title,
  p.song_artist,
  p.song_url,
  p.presenter_comment,
  p.next_presenter_id,
  p.created_at,
  count(r.id)::int                            as ratings_count,
  round(avg(r.score)::numeric, 2)::float8     as avg_score
from public.daily_picks p
left join public.ratings r on r.daily_pick_id = p.id
group by p.id;

grant select on public.daily_picks_summary to anon, authenticated;

-- ----------------------------------------------------------------------------
-- get_leaderboard: nota media recibida por cada miembro en un rango de fechas
-- ----------------------------------------------------------------------------
-- La media se calcula sobre TODAS las puntuaciones recibidas (no es la media de
-- las medias por canción). Sin fechas = histórico completo.
create function public.get_leaderboard(p_from date default null, p_to date default null)
returns table (
  member_id      uuid,
  name           text,
  emoji          text,
  color          text,
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
-- PIN opcional
-- ----------------------------------------------------------------------------
-- Devuelve true si el PIN es correcto o si el miembro no tiene PIN.
create function public.verify_member_pin(p_member_id uuid, p_pin text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select mp.pin_hash = extensions.crypt(coalesce(p_pin, ''), mp.pin_hash)
       from public.member_pins mp
      where mp.member_id = p_member_id),
    true
  );
$$;

-- Crea, cambia o elimina (p_new_pin = null) el PIN. Si ya había uno, exige el actual.
create function public.set_member_pin(p_member_id uuid, p_new_pin text, p_current_pin text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  if not exists (select 1 from public.members where id = p_member_id) then
    raise exception 'No encontramos a esa persona';
  end if;

  if p_new_pin is not null and p_new_pin !~ '^[0-9]{4}$' then
    raise exception 'El PIN debe tener exactamente 4 dígitos';
  end if;

  select pin_hash into v_hash from public.member_pins where member_id = p_member_id;

  if v_hash is not null
     and (p_current_pin is null or v_hash <> extensions.crypt(p_current_pin, v_hash)) then
    raise exception 'El PIN actual no es correcto';
  end if;

  if p_new_pin is null then
    delete from public.member_pins where member_id = p_member_id;
  else
    insert into public.member_pins (member_id, pin_hash)
    values (p_member_id, extensions.crypt(p_new_pin, extensions.gen_salt('bf')))
    on conflict (member_id) do update
      set pin_hash = excluded.pin_hash, updated_at = now();
  end if;

  update public.members set has_pin = (p_new_pin is not null) where id = p_member_id;
end;
$$;

-- Quita el PIN sin pedir el actual (desde /admin, para quien lo haya olvidado).
create function public.admin_clear_member_pin(p_member_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.member_pins where member_id = p_member_id;
  update public.members set has_pin = false where id = p_member_id;
$$;

revoke execute on function public.verify_member_pin(uuid, text) from public;
revoke execute on function public.set_member_pin(uuid, text, text) from public;
revoke execute on function public.admin_clear_member_pin(uuid) from public;
grant execute on function public.verify_member_pin(uuid, text) to anon, authenticated;
grant execute on function public.set_member_pin(uuid, text, text) to anon, authenticated;
grant execute on function public.admin_clear_member_pin(uuid) to anon, authenticated;

-- El trigger no debe poder invocarse como RPC.
revoke execute on function public.ratings_prevent_self_rating() from public, anon, authenticated;
