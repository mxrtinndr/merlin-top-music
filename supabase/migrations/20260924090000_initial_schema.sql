-- ============================================================================
-- Merlin FM · La canción del día
-- Migración 1/2: tablas, restricciones, triggers y políticas RLS
-- ============================================================================
-- No hay autenticación: la app usa la clave anónima de Supabase y la identidad
-- se elige en el cliente. Las políticas RLS son deliberadamente permisivas,
-- salvo para los PIN, que viven en una tabla aparte que el cliente no puede leer.

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- members: personas del equipo
-- ----------------------------------------------------------------------------
create table public.members (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  emoji       text        not null default '🎧',
  color       text        not null default '#2E6FF2',
  -- Lo mantienen las funciones de PIN; el cliente no puede escribirlo.
  has_pin     boolean     not null default false,
  -- Los miembros inactivos no aparecen en selectores, pero conservan su histórico.
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),

  constraint members_name_length check (char_length(btrim(name)) between 1 and 40),
  constraint members_emoji_length check (char_length(emoji) between 1 and 16),
  constraint members_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Nombre único sin distinguir mayúsculas ni espacios sobrantes.
create unique index members_name_unique on public.members (lower(btrim(name)));

comment on table public.members is 'Personas del equipo que presentan y puntúan canciones.';

-- ----------------------------------------------------------------------------
-- member_pins: PIN opcional de 4 dígitos (hash bcrypt). Nunca se expone al cliente.
-- ----------------------------------------------------------------------------
create table public.member_pins (
  member_id   uuid primary key references public.members (id) on delete cascade,
  pin_hash    text        not null,
  updated_at  timestamptz not null default now()
);

comment on table public.member_pins is 'PIN opcional por miembro. Solo accesible mediante funciones security definer.';

-- ----------------------------------------------------------------------------
-- daily_picks: la canción del día
-- ----------------------------------------------------------------------------
create table public.daily_picks (
  id                 uuid primary key default gen_random_uuid(),
  date               date        not null,
  presenter_id       uuid        not null references public.members (id) on delete restrict,
  song_title         text        not null,
  song_artist        text        not null,
  song_url           text,
  presenter_comment  text,
  next_presenter_id  uuid        not null references public.members (id) on delete restrict,
  created_at         timestamptz not null default now(),

  constraint daily_picks_date_unique unique (date),
  constraint daily_picks_title_length check (char_length(btrim(song_title)) between 1 and 200),
  constraint daily_picks_artist_length check (char_length(btrim(song_artist)) between 1 and 200),
  constraint daily_picks_url_format check (song_url is null or song_url ~* '^https?://\S+$'),
  constraint daily_picks_comment_length check (presenter_comment is null or char_length(presenter_comment) <= 1000),
  constraint daily_picks_no_self_nomination check (next_presenter_id <> presenter_id)
);

create index daily_picks_presenter_idx on public.daily_picks (presenter_id);
create index daily_picks_next_presenter_idx on public.daily_picks (next_presenter_id);

comment on table public.daily_picks is 'Una canción por día, elegida por la persona presentadora, que además nomina a la siguiente.';

-- ----------------------------------------------------------------------------
-- ratings: puntuaciones (1–4) del resto del equipo
-- ----------------------------------------------------------------------------
create table public.ratings (
  id             uuid primary key default gen_random_uuid(),
  daily_pick_id  uuid        not null references public.daily_picks (id) on delete cascade,
  member_id      uuid        not null references public.members (id) on delete restrict,
  score          smallint    not null,
  comment        text,
  created_at     timestamptz not null default now(),

  constraint ratings_score_range check (score between 1 and 4),
  constraint ratings_comment_length check (comment is null or char_length(comment) <= 280),
  constraint ratings_one_per_member unique (daily_pick_id, member_id)
);

create index ratings_member_idx on public.ratings (member_id);

comment on table public.ratings is 'Nota de cada miembro a la canción del día. Una por persona y canción.';

-- La persona presentadora no puede puntuar su propia canción.
create function public.ratings_prevent_self_rating()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.daily_picks p
    where p.id = new.daily_pick_id and p.presenter_id = new.member_id
  ) then
    raise exception 'No puedes puntuar tu propia canción 😉';
  end if;
  return new;
end;
$$;

create trigger ratings_prevent_self_rating
  before insert or update on public.ratings
  for each row execute function public.ratings_prevent_self_rating();

-- ----------------------------------------------------------------------------
-- Permisos y RLS
-- ----------------------------------------------------------------------------
-- Partimos de cero y concedemos explícitamente lo necesario.
revoke all on public.members, public.member_pins, public.daily_picks, public.ratings
  from anon, authenticated;

grant select on public.members to anon, authenticated;
grant insert (name, emoji, color) on public.members to anon, authenticated;
grant update (name, emoji, color, active) on public.members to anon, authenticated;

grant select, insert, update on public.daily_picks to anon, authenticated;
grant select, insert on public.ratings to anon, authenticated;
-- member_pins: sin permisos para el cliente.

alter table public.members     enable row level security;
alter table public.member_pins enable row level security;
alter table public.daily_picks enable row level security;
alter table public.ratings     enable row level security;

create policy "members_select" on public.members for select to anon, authenticated using (true);
create policy "members_insert" on public.members for insert to anon, authenticated with check (true);
create policy "members_update" on public.members for update to anon, authenticated using (true) with check (true);

create policy "daily_picks_select" on public.daily_picks for select to anon, authenticated using (true);
create policy "daily_picks_insert" on public.daily_picks for insert to anon, authenticated with check (true);
create policy "daily_picks_update" on public.daily_picks for update to anon, authenticated using (true) with check (true);

create policy "ratings_select" on public.ratings for select to anon, authenticated using (true);
create policy "ratings_insert" on public.ratings for insert to anon, authenticated with check (true);
