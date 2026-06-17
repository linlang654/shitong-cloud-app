-- 事事通校园配送系统 - 后台优先级功能增量 SQL
-- 已执行过 supabase-schema.sql 的项目，只需要再执行本文件一次。
-- 不会删除已有订单数据。

create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_names text default '',
  total_rows integer not null default 0,
  paid_rows integer not null default 0,
  wash_rows integer not null default 0,
  imported_orders integer not null default 0,
  imported_items integer not null default 0,
  operator_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table orders add column if not exists import_batch_id uuid references import_batches(id) on delete set null;

create table if not exists recognition_rules (
  id uuid primary key default gen_random_uuid(),
  keyword text unique not null,
  school text not null,
  campus text not null,
  building text not null,
  enabled boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table import_batches enable row level security;
alter table recognition_rules enable row level security;

drop policy if exists "employees read batches" on import_batches;
drop policy if exists "admins write batches" on import_batches;
drop policy if exists "admins update batches" on import_batches;
drop policy if exists "employees read rules" on recognition_rules;
drop policy if exists "admins write rules" on recognition_rules;
drop policy if exists "admins delete orders" on orders;
drop policy if exists "admins delete batches" on import_batches;

create policy "employees read batches" on import_batches
for select using (auth.role() = 'authenticated');

create policy "admins write batches" on import_batches
for insert with check (public.current_user_role() = 'admin');

create policy "admins update batches" on import_batches
for update using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admins delete batches" on import_batches
for delete using (public.current_user_role() = 'admin');

create policy "employees read rules" on recognition_rules
for select using (auth.role() = 'authenticated');

create policy "admins write rules" on recognition_rules
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admins delete orders" on orders
for delete using (public.current_user_role() = 'admin');

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
