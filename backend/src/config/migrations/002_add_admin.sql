-- Run once in Supabase SQL Editor for an existing OrderFlow database.
alter table public.stores
  add column if not exists is_admin boolean not null default false;

insert into public.stores
  (name, store_code, username, password_hash, is_factory, is_admin, is_active)
values
  ('System Administrator', 'ADMIN', 'admin', 'admin123', true, true, true)
on conflict (username) do update set is_admin = true, is_factory = true, is_active = true;
