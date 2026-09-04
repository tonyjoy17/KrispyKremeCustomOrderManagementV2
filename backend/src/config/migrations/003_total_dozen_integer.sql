-- Run once if 001_add_total_dozen.sql was applied before whole-dozen enforcement.
-- Existing decimal values are rounded to the nearest whole dozen, with a minimum of 1.
alter table public.orders
  drop constraint if exists orders_total_dozen_check;

alter table public.orders
  alter column total_dozen type integer
  using greatest(1, round(total_dozen)::integer);

alter table public.orders
  alter column total_dozen set not null;

alter table public.orders
  add constraint orders_total_dozen_check check (total_dozen > 0);
