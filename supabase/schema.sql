-- DailyControl — esquema completo de la base (proyecto nuevo, desde cero).
-- Correr UNA vez en Supabase → SQL Editor sobre un proyecto vacío.
--
-- Modelo de acceso:
--   * Dueño: usuario normal de Supabase Auth (correo + contraseña). Es dueño de 1 restaurante.
--   * Empleado (mesero/repartidor): inicia sesión ANÓNIMA y canjea su código con claim_employee().
--     Eso lo liga a un restaurante en employee_sessions. Borrar al empleado le quita el acceso.
--   * Cada fila lleva restaurant_id y RLS impide ver o tocar datos de otro negocio.

-- ── Tablas ──────────────────────────────────────────────────────────────────

create table public.restaurants (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null unique references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.employees (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null,
  role          text not null check (role in ('mesero', 'repartidor')),
  access_code   text not null unique,
  created_at    timestamptz not null default now()
);

-- Qué usuario anónimo está actuando como qué empleado. Solo la tocan las funciones de abajo.
create table public.employee_sessions (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  employee_id   uuid not null references public.employees(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade
);

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references public.restaurants(id) on delete cascade,
  order_number    text,
  items           jsonb not null default '[]',
  subtotal        numeric not null default 0,
  discount        numeric not null default 0,
  total           numeric not null default 0,
  note            text not null default '',
  "paymentMethod" text not null default 'Efectivo',
  delivery        jsonb,
  mesero          text,
  "table"         text,
  "time"          text,
  "date"          text,
  "timestamp"     bigint not null default (extract(epoch from now()) * 1000)::bigint,
  status          text not null default 'open',
  created_at      timestamptz not null default now()
);
create index orders_restaurant_ts on public.orders (restaurant_id, "timestamp" desc);

create table public.rc_ingredientes (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  nombre        text not null,
  unidad        text,
  precio        numeric not null default 0,
  porciones     numeric not null default 1,
  created_at    timestamptz not null default now()
);

create table public.rc_preparaciones (
  id                 uuid primary key default gen_random_uuid(),
  restaurant_id      uuid not null references public.restaurants(id) on delete cascade,
  nombre             text not null,
  descripcion        text not null default '',
  porciones          numeric not null default 1,
  gramos_por_porcion numeric,
  ingredientes       jsonb not null default '[]',
  created_at         timestamptz not null default now()
);

create table public.rc_recetas (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  product_id    bigint not null, -- id del producto del menú (hoy vive en el navegador, es Date.now())
  lines         jsonb not null default '[]',
  created_at    timestamptz not null default now(),
  unique (restaurant_id, product_id)
);

create table public.rc_lotes (
  id                 uuid primary key default gen_random_uuid(),
  restaurant_id      uuid not null references public.restaurants(id) on delete cascade,
  preparacion_id     uuid references public.rc_preparaciones(id) on delete set null,
  preparacion_nombre text not null default '',
  kg_comprados       numeric,
  precio_kg          numeric,
  g_rendidos         numeric,
  tacos_salieron     numeric,
  merma_pct          numeric,
  costo_por_taco     numeric,
  notas              text not null default '',
  fecha              timestamptz not null default now()
);

-- ── Funciones de acceso ─────────────────────────────────────────────────────

create function public.is_anonymous() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
$$;

-- Restaurantes a los que el usuario actual tiene acceso (como dueño o como empleado).
create function public.my_restaurant_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select id from public.restaurants where owner_id = auth.uid()
  union
  select restaurant_id from public.employee_sessions where user_id = auth.uid()
$$;

create function public.owns_restaurant(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.restaurants where id = rid and owner_id = auth.uid())
$$;

-- Login de empleado: el usuario anónimo canjea su código y queda ligado al restaurante.
create function public.claim_employee(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  e record;
begin
  if auth.uid() is null or not public.is_anonymous() then
    raise exception 'Solo para sesiones de empleado';
  end if;

  select em.id, em.name, em.role, em.restaurant_id, r.name as restaurant_name
    into e
    from public.employees em
    join public.restaurants r on r.id = em.restaurant_id
   where em.access_code = upper(trim(p_code));

  if not found then
    raise exception 'Código incorrecto';
  end if;

  insert into public.employee_sessions (user_id, employee_id, restaurant_id)
  values (auth.uid(), e.id, e.restaurant_id)
  on conflict (user_id) do update
    set employee_id = excluded.employee_id, restaurant_id = excluded.restaurant_id;

  return jsonb_build_object(
    'id', e.id, 'name', e.name, 'role', e.role,
    'restaurant_id', e.restaurant_id, 'restaurant_name', e.restaurant_name
  );
end $$;

revoke execute on function public.claim_employee(text) from public, anon;
grant execute on function public.claim_employee(text) to authenticated;

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.restaurants       enable row level security;
alter table public.employees         enable row level security;
alter table public.employee_sessions enable row level security; -- sin políticas: nadie la lee directo
alter table public.orders            enable row level security;
alter table public.rc_ingredientes   enable row level security;
alter table public.rc_preparaciones  enable row level security;
alter table public.rc_recetas        enable row level security;
alter table public.rc_lotes          enable row level security;

-- Restaurantes: lo ven dueño y empleados; solo un dueño real (no anónimo) crea el suyo.
-- owner_id directo: en INSERT ... RETURNING la función aún no ve la fila nueva.
create policy restaurants_select on public.restaurants for select
  using (owner_id = auth.uid() or id in (select public.my_restaurant_ids()));
create policy restaurants_insert on public.restaurants for insert
  with check (owner_id = auth.uid() and not public.is_anonymous());
create policy restaurants_update on public.restaurants for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Empleados: solo el dueño los administra.
create policy employees_owner on public.employees for all
  using (public.owns_restaurant(restaurant_id))
  with check (public.owns_restaurant(restaurant_id));

-- Pedidos: dueño y empleados del mismo restaurante leen, crean y actualizan.
create policy orders_select on public.orders for select
  using (restaurant_id in (select public.my_restaurant_ids()));
create policy orders_insert on public.orders for insert
  with check (restaurant_id in (select public.my_restaurant_ids()));
create policy orders_update on public.orders for update
  using (restaurant_id in (select public.my_restaurant_ids()))
  with check (restaurant_id in (select public.my_restaurant_ids()));
-- Borrar: el dueño cualquiera; un empleado solo cuentas abiertas (mesas sin cobrar).
create policy orders_delete on public.orders for delete
  using (
    public.owns_restaurant(restaurant_id)
    or (status = 'open' and restaurant_id in (select public.my_restaurant_ids()))
  );

-- Costeo: solo el dueño (son costos internos).
create policy rc_ingredientes_owner on public.rc_ingredientes for all
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));
create policy rc_preparaciones_owner on public.rc_preparaciones for all
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));
create policy rc_recetas_owner on public.rc_recetas for all
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));
create policy rc_lotes_owner on public.rc_lotes for all
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));

-- ── Realtime (cocina y repartidor se actualizan solos) ──────────────────────

alter table public.orders replica identity full; -- para que los DELETE traigan restaurant_id
alter publication supabase_realtime add table public.orders;
