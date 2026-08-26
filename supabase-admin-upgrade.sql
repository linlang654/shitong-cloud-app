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

-- 每个水洗标独立保存洗护店结算品类；历史数据默认待确认，不做不安全的批量猜测。
alter table order_items add column if not exists settlement_category text not null default 'unconfirmed';
alter table order_items add column if not exists settlement_category_confirmed boolean not null default false;
alter table order_items add column if not exists settlement_category_updated_by uuid references profiles(id);
alter table order_items add column if not exists settlement_category_updated_at timestamptz;
alter table order_items add column if not exists settlement_other_name text not null default '';
alter table order_items add column if not exists settlement_other_unit text not null default '件';
alter table order_items add column if not exists settlement_cost_snapshot numeric(10,2);

-- 单个水洗标的补差、退洗与退款记录；同一订单的其他物品继续独立流转。
alter table order_items add column if not exists wash_decision text not null default 'normal';
alter table order_items add column if not exists price_adjustment_type text not null default 'none';
alter table order_items add column if not exists price_adjustment_amount numeric(10,2) not null default 0;
alter table order_items add column if not exists wash_decision_reason text not null default '';
alter table order_items add column if not exists wash_decision_note text not null default '';
alter table order_items add column if not exists wash_decision_updated_by uuid references profiles(id);
alter table order_items add column if not exists wash_decision_updated_at timestamptz;

create table if not exists settlement_catalog (
  key text primary key,
  group_name text not null default '',
  label text not null,
  short_label text not null default '',
  unit text not null default '件' check (unit in ('件', '双')),
  detail text not null default '',
  retail_price numeric(10,2),
  cost_price numeric(10,2),
  is_active boolean not null default false,
  sort_order integer not null default 0,
  source text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into settlement_catalog
  (key, group_name, label, short_label, unit, detail, is_active, sort_order, source)
values
  ('regular_shoe', '当前在售', '休闲鞋/运动鞋/帆布鞋/板鞋', '普通鞋', '双', '含网面普通鞋；特殊材质和靴类需另选', true, 10, '系统兼容品类'),
  ('suede_shoe', '当前在售', '绒面/鹿皮/翻毛皮', '绒面/鹿皮', '双', '绒面、鹿皮、麂皮、翻毛皮鞋', true, 20, '系统兼容品类'),
  ('short_boot', '当前在售', '短靴/雪地靴/大黄靴', '短靴类', '双', '普通短靴、雪地靴、大黄靴、棉靴', true, 30, '系统兼容品类'),
  ('tall_boot', '当前在售', '中高靴/高筒靴', '中高靴', '双', '超过脚踝的中筒靴、高筒靴', true, 40, '系统兼容品类'),
  ('tshirt', '当前在售', 'T恤', 'T恤', '件', 'T恤、短袖、长袖、Polo衫', true, 50, '系统兼容品类'),
  ('pants_skirt', '当前在售', '短裙/短裤/牛仔裤/普通西裤', '裤裙类', '件', '含休闲裤、普通西裤', true, 60, '系统兼容品类'),
  ('knit_shirt', '当前在售', '毛衣/卫衣/衬衫', '毛衣衬衫', '件', '毛衣、卫衣、衬衫', true, 70, '系统兼容品类'),
  ('light_outerwear', '当前在售', '短夹克/薄外套/防晒衣/普通西装外套', '薄外套', '件', '短夹克、薄外套、防晒衣、普通西装外套', true, 80, '系统兼容品类'),
  ('heavy_outerwear', '当前在售', '冲锋衣/风衣/羽绒服/棉服/毛呢大衣', '厚款衣物', '件', '含羊毛、羊绒、呢子大衣', true, 90, '系统兼容品类'),
  ('dress_formal', '当前在售', '连衣裙/马面裙/普通礼服', '礼服裙装', '件', '连衣裙、马面裙、普通礼服', true, 100, '系统兼容品类'),
  ('luxury_fur', '当前在售', '奢侈品鞋类/皮草护理', '奢侈品/皮草', '件', '奢侈品鞋类和皮草护理', true, 110, '系统兼容品类'),
  ('other', '其他', '其他品类', '其他品类', '件', '未在售或临时收取的物品，需填写实际名称和代工价', true, 9999, '系统固定品类')
on conflict (key) do nothing;

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

create table if not exists daily_reconciliations (
  reconcile_date date primary key,
  system_normal_shoe_count integer not null default 0,
  system_special_shoe_count integer not null default 0,
  system_thin_count integer not null default 0,
  system_thick_count integer not null default 0,
  system_mixed_count integer not null default 0,
  system_other_count integer not null default 0,
  actual_normal_shoe_count integer not null default 0,
  actual_special_shoe_count integer not null default 0,
  actual_thin_count integer not null default 0,
  actual_thick_count integer not null default 0,
  actual_mixed_count integer not null default 0,
  actual_other_count integer not null default 0,
  system_settlement_counts jsonb not null default '{}'::jsonb,
  actual_settlement_counts jsonb not null default '{}'::jsonb,
  system_other_details jsonb not null default '[]'::jsonb,
  system_total_cost numeric(12,2) not null default 0,
  unconfirmed_count integer not null default 0,
  status text not null default '待核对' check (status in ('待核对', '已核对', '有差异')),
  checked_by uuid references profiles(id),
  checked_by_name text not null default '',
  reference_note text not null default '',
  checked_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table daily_reconciliations add column if not exists system_normal_shoe_count integer not null default 0;
alter table daily_reconciliations add column if not exists system_special_shoe_count integer not null default 0;
alter table daily_reconciliations add column if not exists system_thin_count integer not null default 0;
alter table daily_reconciliations add column if not exists system_thick_count integer not null default 0;
alter table daily_reconciliations add column if not exists system_mixed_count integer not null default 0;
alter table daily_reconciliations add column if not exists system_other_count integer not null default 0;
alter table daily_reconciliations add column if not exists actual_normal_shoe_count integer not null default 0;
alter table daily_reconciliations add column if not exists actual_special_shoe_count integer not null default 0;
alter table daily_reconciliations add column if not exists actual_thin_count integer not null default 0;
alter table daily_reconciliations add column if not exists actual_thick_count integer not null default 0;
alter table daily_reconciliations add column if not exists actual_mixed_count integer not null default 0;
alter table daily_reconciliations add column if not exists actual_other_count integer not null default 0;
alter table daily_reconciliations add column if not exists system_settlement_counts jsonb not null default '{}'::jsonb;
alter table daily_reconciliations add column if not exists actual_settlement_counts jsonb not null default '{}'::jsonb;
alter table daily_reconciliations add column if not exists system_other_details jsonb not null default '[]'::jsonb;
alter table daily_reconciliations add column if not exists system_total_cost numeric(12,2) not null default 0;
alter table daily_reconciliations add column if not exists unconfirmed_count integer not null default 0;

alter table import_batches enable row level security;
alter table recognition_rules enable row level security;
alter table daily_reconciliations enable row level security;
alter table settlement_catalog enable row level security;

drop policy if exists "employees read batches" on import_batches;
drop policy if exists "admins write batches" on import_batches;
drop policy if exists "admins update batches" on import_batches;
drop policy if exists "employees read rules" on recognition_rules;
drop policy if exists "admins write rules" on recognition_rules;
drop policy if exists "admins delete orders" on orders;
drop policy if exists "admins delete batches" on import_batches;
drop policy if exists "admins manage reconciliations" on daily_reconciliations;
drop policy if exists "employees read settlement catalog" on settlement_catalog;
drop policy if exists "admins manage settlement catalog" on settlement_catalog;

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

create policy "admins manage reconciliations" on daily_reconciliations
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "employees read settlement catalog" on settlement_catalog
for select using (auth.role() = 'authenticated');

create policy "admins manage settlement catalog" on settlement_catalog
for all using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

grant select on public.settlement_catalog to authenticated;
grant insert, update, delete on public.settlement_catalog to authenticated;

-- 最新结算表的明细品类与价格请单独导入 Supabase；经营价格文件不要提交到公开仓库。

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
