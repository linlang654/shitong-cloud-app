-- 事事通校园配送系统 - Supabase 初始化 SQL
-- 在 Supabase SQL Editor 中完整执行一次。

create extension if not exists pgcrypto;

create table if not exists business_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

insert into business_types (code, name)
values ('wash_care', '洗护')
on conflict (code) do nothing;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text,
  role text not null check (role in ('admin', 'courier', 'factory')),
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  business_type text not null default 'wash_care',
  source text default 'excel',
  merchant text,
  customer_name text not null,
  phone text not null,
  address text,
  school text,
  campus text,
  building text,
  paid_amount numeric,
  order_time timestamptz,
  pay_time timestamptz,
  order_status text not null default '待取件',
  exception_note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  barcode text unique not null,
  source_key text unique,
  product_name text,
  spec text,
  item_index integer not null default 1,
  image_links text,
  item_status text not null default '待取件',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table order_items add column if not exists source_key text;
create unique index if not exists order_items_source_key_idx
on order_items(source_key)
where source_key is not null;

create table if not exists pickup_tasks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  pickup_date date,
  status text not null default '待取件',
  exception_note text default '',
  operator_id uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique(order_id)
);

create table if not exists return_tasks (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references order_items(id) on delete cascade,
  outbound_date date not null default current_date,
  status text not null default '待送回',
  exception_note text default '',
  operator_id uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique(item_id)
);

create table if not exists factory_scans (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references order_items(id) on delete cascade,
  barcode text not null,
  scan_type text not null check (scan_type in ('factory_in', 'factory_out')),
  operator_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  item_id uuid references order_items(id) on delete cascade,
  barcode text,
  status text not null,
  note text default '',
  operator_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists service_areas (
  id uuid primary key default gen_random_uuid(),
  school text not null,
  campus text not null,
  building text not null,
  created_at timestamptz not null default now(),
  unique(school, campus, building)
);

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.track_by_phone(query_phone text)
returns table (
  order_no text,
  customer_name text,
  phone text,
  address text,
  school text,
  campus text,
  building text,
  paid_amount numeric,
  order_time timestamptz,
  order_status text,
  barcode text,
  product_name text,
  spec text,
  item_status text,
  latest_note text
)
language sql
security definer
set search_path = public
as $$
  select
    o.order_no,
    o.customer_name,
    o.phone,
    o.address,
    o.school,
    o.campus,
    o.building,
    o.paid_amount,
    o.order_time,
    o.order_status,
    i.barcode,
    i.product_name,
    i.spec,
    i.item_status,
    coalesce((
      select sl.note
      from status_logs sl
      where sl.item_id = i.id or sl.order_id = o.id
      order by sl.created_at desc
      limit 1
    ), '') as latest_note
  from orders o
  left join order_items i on i.order_id = o.id
  where o.phone = query_phone
  order by o.order_time desc nulls last, i.barcode asc
  limit 80;
$$;

create or replace function public.track_timeline_by_phone(query_phone text)
returns table (
  order_no text,
  barcode text,
  status text,
  note text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    o.order_no,
    coalesce(sl.barcode, i.barcode, '') as barcode,
    sl.status,
    coalesce(sl.note, '') as note,
    sl.created_at
  from orders o
  join status_logs sl on sl.order_id = o.id
  left join order_items i on i.id = sl.item_id
  where o.phone = query_phone
  order by o.order_time desc nulls last, sl.created_at asc;
$$;

grant execute on function public.track_timeline_by_phone(text) to anon, authenticated;

alter table profiles enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table pickup_tasks enable row level security;
alter table return_tasks enable row level security;
alter table factory_scans enable row level security;
alter table status_logs enable row level security;
alter table service_areas enable row level security;
alter table business_types enable row level security;

drop policy if exists "profiles own read" on profiles;
drop policy if exists "profiles admin read all" on profiles;
drop policy if exists "employees read orders" on orders;
drop policy if exists "admins write orders" on orders;
drop policy if exists "employees update orders" on orders;
drop policy if exists "employees read items" on order_items;
drop policy if exists "admins write items" on order_items;
drop policy if exists "admins update items" on order_items;
drop policy if exists "employees update items" on order_items;
drop policy if exists "employees read pickup" on pickup_tasks;
drop policy if exists "employees write pickup" on pickup_tasks;
drop policy if exists "employees read return" on return_tasks;
drop policy if exists "employees write return" on return_tasks;
drop policy if exists "employees read scans" on factory_scans;
drop policy if exists "employees insert scans" on factory_scans;
drop policy if exists "employees read logs" on status_logs;
drop policy if exists "employees insert logs" on status_logs;
drop policy if exists "employees read areas" on service_areas;
drop policy if exists "admins write areas" on service_areas;
drop policy if exists "employees read business types" on business_types;

create policy "profiles own read" on profiles
for select using (auth.uid() = id);

create policy "profiles admin read all" on profiles
for select using (
  public.current_user_role() = 'admin'
);

create policy "employees read orders" on orders
for select using (auth.role() = 'authenticated');

create policy "admins write orders" on orders
for insert with check (
  public.current_user_role() = 'admin'
);

create policy "employees update orders" on orders
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "employees read items" on order_items
for select using (auth.role() = 'authenticated');

create policy "admins write items" on order_items
for insert with check (
  public.current_user_role() = 'admin'
);

create policy "admins update items" on order_items
for update using (
  public.current_user_role() = 'admin'
) with check (
  public.current_user_role() = 'admin'
);

create policy "employees update items" on order_items
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "employees read pickup" on pickup_tasks
for select using (auth.role() = 'authenticated');

create policy "employees write pickup" on pickup_tasks
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "employees read return" on return_tasks
for select using (auth.role() = 'authenticated');

create policy "employees write return" on return_tasks
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "employees read scans" on factory_scans
for select using (auth.role() = 'authenticated');

create policy "employees insert scans" on factory_scans
for insert with check (auth.role() = 'authenticated');

create policy "employees read logs" on status_logs
for select using (auth.role() = 'authenticated');

create policy "employees insert logs" on status_logs
for insert with check (auth.role() = 'authenticated');

create policy "employees read areas" on service_areas
for select using (auth.role() = 'authenticated');

create policy "admins write areas" on service_areas
for all using (
  public.current_user_role() = 'admin'
) with check (
  public.current_user_role() = 'admin'
);

create policy "employees read business types" on business_types
for select using (auth.role() = 'authenticated');
