-- DailyControl — paso 2: configuración, menú, turnos y caja chica en la nube.
-- Correr DESPUÉS de schema.sql, una sola vez, en Supabase → SQL Editor.

-- ── Configuración + menú: una fila por restaurante ──────────────────────────
create table public.restaurant_settings (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  config        jsonb not null default '{}',
  categories    jsonb not null default '[]',
  products      jsonb not null default '[]',
  updated_at    timestamptz not null default now()
);

-- ── Turnos: el abierto es el que tiene "closedAt" null ──────────────────────
create table public.shifts (
  id                    uuid primary key default gen_random_uuid(),
  restaurant_id         uuid not null references public.restaurants(id) on delete cascade,
  cajero                text not null,
  "fondoInicial"        numeric not null default 0,
  "openedAt"            timestamptz not null default now(),
  "closedAt"            timestamptz,
  -- resumen del corte (se llena al cerrar)
  orders                integer,
  "ventasEfectivo"      numeric,
  "ventasTransferencia" numeric,
  "ventasEnvios"        numeric,
  "enviosEfectivo"      numeric,
  "totalVentas"         numeric,
  "totalEnvios"         numeric,
  "efectivoEsperado"    numeric,
  "efectivoReal"        numeric,
  diferencia            numeric
);
-- Solo un turno abierto por restaurante (evita que dos dispositivos abran a la vez).
create unique index shifts_one_open on public.shifts (restaurant_id) where "closedAt" is null;

-- ── Caja chica ──────────────────────────────────────────────────────────────
create table public.caja_movements (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  "shiftId"     uuid references public.shifts(id) on delete set null,
  "shiftLabel"  text,
  type          text not null,
  amount        numeric not null,
  description   text not null default '',
  date          text,
  time          text,
  "timestamp"   bigint not null default (extract(epoch from now()) * 1000)::bigint
);
create index caja_restaurant_ts on public.caja_movements (restaurant_id, "timestamp" desc);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.restaurant_settings enable row level security;
alter table public.shifts              enable row level security;
alter table public.caja_movements      enable row level security;

-- Config y menú: todos los del restaurante leen (el mesero necesita el menú); solo el dueño edita.
create policy settings_select on public.restaurant_settings for select
  using (restaurant_id in (select public.my_restaurant_ids()));
create policy settings_insert on public.restaurant_settings for insert
  with check (public.owns_restaurant(restaurant_id));
create policy settings_update on public.restaurant_settings for update
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));

-- Turnos: dueño y meseros abren, ven y cierran. Nadie los borra.
create policy shifts_select on public.shifts for select
  using (restaurant_id in (select public.my_restaurant_ids()));
create policy shifts_insert on public.shifts for insert
  with check (restaurant_id in (select public.my_restaurant_ids()));
create policy shifts_update on public.shifts for update
  using (restaurant_id in (select public.my_restaurant_ids()))
  with check (restaurant_id in (select public.my_restaurant_ids()));

-- Caja: todos registran; solo el dueño borra.
create policy caja_select on public.caja_movements for select
  using (restaurant_id in (select public.my_restaurant_ids()));
create policy caja_insert on public.caja_movements for insert
  with check (restaurant_id in (select public.my_restaurant_ids()));
create policy caja_delete on public.caja_movements for delete
  using (public.owns_restaurant(restaurant_id));

-- ── Realtime ────────────────────────────────────────────────────────────────
alter table public.restaurant_settings replica identity full;
alter table public.shifts              replica identity full;
alter table public.caja_movements      replica identity full;
alter publication supabase_realtime add table public.restaurant_settings, public.shifts, public.caja_movements;
