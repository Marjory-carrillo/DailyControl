-- DailyControl — paso 4: separar "pagado" de la etapa de cocina.
-- Correr DESPUÉS de 003, una sola vez, en Supabase → SQL Editor, ANTES de publicar el código nuevo.

alter table public.orders add column "paidAt" timestamptz;

-- Pedidos ya cerrados se consideran pagados en su última hora registrada.
update public.orders set "paidAt" = to_timestamp("timestamp" / 1000.0)
 where status in ('paid', 'entregado');

create index orders_restaurant_paid on public.orders (restaurant_id, "paidAt");
