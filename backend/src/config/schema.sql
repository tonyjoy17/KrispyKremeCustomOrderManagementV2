-- DESTRUCTIVE RESET: run this migration in the Supabase SQL editor.
-- Order images must be removed through the Storage API. The reset script does this.
drop table if exists public.orders cascade;
drop table if exists public.stores cascade;
drop sequence if exists public.order_number_seq cascade;

create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  store_code varchar(20) not null unique,
  username varchar(50) not null unique,
  password_hash varchar(255) not null,
  email varchar(100), phone varchar(20), address text,
  is_factory boolean not null default false,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number varchar(20) not null unique,
  store_id uuid not null references public.stores(id) on delete restrict,
  customer_name varchar(100) not null,
  customer_phone varchar(20) not null,
  customer_email varchar(100),
  order_details text not null,
  total_dozen integer not null check (total_dozen > 0),
  is_paid boolean not null default false,
  reference_image_path text,
  pickup_store_id uuid not null references public.stores(id) on delete restrict,
  pickup_date date not null,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'in_progress', 'ready', 'completed', 'cancelled')),
  email_sent boolean not null default false,
  email_sent_at timestamptz,
  created_by uuid references public.stores(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_store_id on public.orders(store_id);
create index if not exists idx_orders_pickup_store_id on public.orders(pickup_store_id);
create index if not exists idx_orders_pickup_date on public.orders(pickup_date);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_stores_username on public.stores(username);
create index if not exists idx_stores_is_factory on public.stores(is_factory);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists update_stores_updated_at on public.stores;
create trigger update_stores_updated_at before update on public.stores
for each row execute function public.update_updated_at_column();
drop trigger if exists update_orders_updated_at on public.orders;
create trigger update_orders_updated_at before update on public.orders
for each row execute function public.update_updated_at_column();

create sequence if not exists public.order_number_seq start 1000;
create or replace function public.generate_order_number()
returns text language sql security definer set search_path = '' as $$
  select 'ORD-' || to_char(now() at time zone 'Australia/Adelaide', 'YYYYMM') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 4, '0');
$$;
revoke all on function public.generate_order_number() from public, anon, authenticated;
grant execute on function public.generate_order_number() to service_role;

insert into public.stores (name, store_code, username, password_hash, is_factory, is_active)
values ('Factory / Production', 'FACTORY', 'factory', 'factory123', true, true)
on conflict (username) do nothing;

insert into public.stores
  (name, store_code, username, password_hash, email, is_factory, is_active)
values
  ('Test Retail Store', 'TEST', 'teststore', 'test123', 'test@example.com', false, true)
on conflict (username) do nothing;

insert into public.stores
  (name, store_code, username, password_hash, is_factory, is_admin, is_active)
values
  ('System Administrator', 'ADMIN', 'admin', 'admin123', true, true, true)
on conflict (username) do nothing;

-- The API uses a server-side service-role client, which bypasses RLS.
alter table public.stores enable row level security;
alter table public.orders enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-images', 'order-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
