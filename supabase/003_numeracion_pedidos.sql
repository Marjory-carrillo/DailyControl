-- DailyControl — paso 3: número de pedido lo asigna la base (no se repite entre dispositivos).
-- Correr DESPUÉS de 002, una sola vez, en Supabase → SQL Editor.

-- Zona horaria del negocio: define cuándo empieza "el día" para reiniciar la numeración.
alter table public.restaurants add column timezone text not null default 'America/Matamoros';

-- Último número usado por restaurante y día. Solo lo toca el trigger.
create table public.order_counters (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  day           date not null,
  last_number   integer not null,
  primary key (restaurant_id, day)
);
alter table public.order_counters enable row level security; -- sin políticas: nadie la lee directo

-- Al insertar: siguiente número del día (empieza en #10). El upsert es atómico, así que
-- dos cobros simultáneos nunca reciben el mismo número.
create function public.assign_order_number() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  tz  text;
  num integer;
begin
  select timezone into tz from public.restaurants where id = new.restaurant_id;
  insert into public.order_counters as c (restaurant_id, day, last_number)
  values (new.restaurant_id, (now() at time zone coalesce(tz, 'America/Matamoros'))::date, 10)
  on conflict (restaurant_id, day) do update set last_number = c.last_number + 1
  returning last_number into num;
  new.order_number := num::text;
  return new;
end $$;

-- Al actualizar: el número nunca cambia (antes la app lo pisaba con el id al editar una mesa).
create function public.keep_order_number() returns trigger
language plpgsql as $$
begin
  new.order_number := old.order_number;
  return new;
end $$;

create trigger orders_assign_number before insert on public.orders
  for each row execute function public.assign_order_number();
create trigger orders_keep_number before update on public.orders
  for each row execute function public.keep_order_number();
