-- ============================================================================
-- Merlin FM · La canción del día
-- Migración 5: cuentas de administración
-- ============================================================================
-- Solo las personas administradoras entran en /admin. Para entrar necesitan
-- tener PIN (si no, cualquiera podría elegir su nombre en el selector) y lo
-- confirman al abrir el panel. Quitar el PIN de otra persona ya no está
-- abierto a todo el mundo: la función exige el id y el PIN de un admin.

alter table public.members
  add column is_admin boolean not null default false;

comment on column public.members.is_admin is
  'Acceso a /admin. El cliente no puede escribirlo: se cambia solo por SQL.';

-- Sin grant de insert/update sobre is_admin: los permisos por columna de la
-- migración 1 hacen que el cliente solo pueda leerlo.

update public.members
   set is_admin = true
 where lower(btrim(name)) in ('martín', 'martin', 'sara');

-- ----------------------------------------------------------------------------
-- Quitar un PIN olvidado: ahora solo un admin con su PIN correcto
-- ----------------------------------------------------------------------------
drop function public.admin_clear_member_pin(uuid);

create function public.admin_clear_member_pin(p_admin_id uuid, p_admin_pin text, p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  if not exists (select 1 from public.members where id = p_admin_id and is_admin and active) then
    raise exception 'Solo una persona administradora puede quitar PIN';
  end if;

  select pin_hash into v_hash from public.member_pins where member_id = p_admin_id;

  if v_hash is null then
    raise exception 'Ponte un PIN antes de administrar el equipo';
  end if;

  if p_admin_pin is null or v_hash <> extensions.crypt(p_admin_pin, v_hash) then
    raise exception 'Tu PIN de administración no es correcto';
  end if;

  delete from public.member_pins where member_id = p_member_id;
  update public.members set has_pin = false where id = p_member_id;
end;
$$;

revoke execute on function public.admin_clear_member_pin(uuid, text, uuid) from public;
grant execute on function public.admin_clear_member_pin(uuid, text, uuid) to anon, authenticated;
