-- DailyControl — paso 5: la hora de cobro la pone el servidor y no cambia.
-- Correr DESPUÉS de 004, una sola vez, en Supabase → SQL Editor.

-- paidAt usa el reloj del servidor (el mismo de shifts."openedAt") y, una vez puesto, no se mueve.
-- Así un celular con la hora atrasada o una copia vieja del pedido no saca una venta de su corte.
create function public.stamp_paid_at() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old."paidAt" is not null then
    new."paidAt" := old."paidAt";
  elsif new."paidAt" is not null then
    new."paidAt" := now();
  end if;
  return new;
end $$;

create trigger orders_stamp_paid before insert or update on public.orders
  for each row execute function public.stamp_paid_at();

-- Un empleado solo borra cuentas abiertas SIN cobrar (antes podía borrar una venta reabierta).
drop policy orders_delete on public.orders;
create policy orders_delete on public.orders for delete
  using (
    public.owns_restaurant(restaurant_id)
    or (status = 'open' and "paidAt" is null and restaurant_id in (select public.my_restaurant_ids()))
  );
