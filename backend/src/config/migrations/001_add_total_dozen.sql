-- Run once in Supabase SQL Editor for an existing OrderFlow database.
-- Existing orders receive 1 dozen; adjust them afterward if necessary.
alter table public.orders
  add column if not exists total_dozen integer;

update public.orders
set total_dozen = 1
where total_dozen is null;

alter table public.orders
  alter column total_dozen set not null;

alter table public.orders
  drop constraint if exists orders_total_dozen_check;

alter table public.orders
  add constraint orders_total_dozen_check check (total_dozen > 0);
