-- ============================================================================
-- Merlin FM · La canción del día
-- Migración 6: días festivos
-- ============================================================================
-- Los festivos no tienen canción, igual que el fin de semana: si el miércoles
-- es festivo, quien presenta el martes nomina a alguien para el jueves. Solo
-- los admins (con su PIN) pueden marcarlos o quitarlos; leerlos es público.

create table public.holidays (
  date        date        primary key,
  name        text,
  created_by  uuid        references public.members (id) on delete set null,
  created_at  timestamptz not null default now(),

  constraint holidays_name_length check (name is null or char_length(btrim(name)) between 1 and 60)
);

comment on table public.holidays is 'Días sin canción (además del fin de semana). Los gestionan los admins.';

revoke all on public.holidays from anon, authenticated;
grant select on public.holidays to anon, authenticated;

alter table public.holidays enable row level security;
create policy "holidays_select" on public.holidays for select to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- Un festivo no admite canción
-- ----------------------------------------------------------------------------
create function public.daily_picks_prevent_holiday()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.holidays h where h.date = new.date) then
    raise exception 'Hoy es festivo: no hay canción del día 🏖️';
  end if;
  return new;
end;
$$;

create trigger daily_picks_prevent_holiday
  before insert or update of date on public.daily_picks
  for each row execute function public.daily_picks_prevent_holiday();

revoke execute on function public.daily_picks_prevent_holiday() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Gestión desde /admin: exige el id y el PIN de un admin
-- ----------------------------------------------------------------------------
create function public.assert_admin(p_admin_id uuid, p_admin_pin text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  if not exists (select 1 from public.members where id = p_admin_id and is_admin and active) then
    raise exception 'Solo una persona administradora puede hacer esto';
  end if;

  select pin_hash into v_hash from public.member_pins where member_id = p_admin_id;

  if v_hash is null then
    raise exception 'Ponte un PIN antes de administrar el equipo';
  end if;

  if p_admin_pin is null or v_hash <> extensions.crypt(p_admin_pin, v_hash) then
    raise exception 'Tu PIN de administración no es correcto';
  end if;
end;
$$;

create function public.admin_set_holiday(p_admin_id uuid, p_admin_pin text, p_date date, p_name text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(btrim(p_name), '');
begin
  perform public.assert_admin(p_admin_id, p_admin_pin);

  if p_date is null then
    raise exception 'Elige una fecha';
  end if;

  if extract(isodow from p_date) > 5 then
    raise exception 'Ese día ya es fin de semana: no hace falta marcarlo';
  end if;

  if exists (select 1 from public.daily_picks where date = p_date) then
    raise exception 'Ese día ya tiene canción: no se puede marcar como festivo';
  end if;

  insert into public.holidays (date, name, created_by)
  values (p_date, v_name, p_admin_id)
  on conflict (date) do update set name = excluded.name;
end;
$$;

create function public.admin_delete_holiday(p_admin_id uuid, p_admin_pin text, p_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin(p_admin_id, p_admin_pin);
  delete from public.holidays where date = p_date;
end;
$$;

revoke execute on function public.assert_admin(uuid, text) from public, anon, authenticated;
revoke execute on function public.admin_set_holiday(uuid, text, date, text) from public;
revoke execute on function public.admin_delete_holiday(uuid, text, date) from public;
grant execute on function public.admin_set_holiday(uuid, text, date, text) to anon, authenticated;
grant execute on function public.admin_delete_holiday(uuid, text, date) to anon, authenticated;
