-- 事事通：在售品类、其他品类与结算成本增量升级
-- 仅新增表/字段/策略，不删除订单或历史数据。

alter table public.order_items add column if not exists settlement_other_name text not null default '';
alter table public.order_items add column if not exists settlement_other_unit text not null default '件';
alter table public.order_items add column if not exists settlement_cost_snapshot numeric(10,2);

create table if not exists public.settlement_catalog (
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

insert into public.settlement_catalog
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

alter table public.daily_reconciliations add column if not exists system_other_details jsonb not null default '[]'::jsonb;
alter table public.daily_reconciliations add column if not exists system_total_cost numeric(12,2) not null default 0;

alter table public.settlement_catalog enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'settlement_catalog' and policyname = 'employees read settlement catalog'
  ) then
    create policy "employees read settlement catalog" on public.settlement_catalog
      for select using (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'settlement_catalog' and policyname = 'admins manage settlement catalog'
  ) then
    create policy "admins manage settlement catalog" on public.settlement_catalog
      for all using (public.current_user_role() = 'admin')
      with check (public.current_user_role() = 'admin');
  end if;
end $$;

grant select, insert, update, delete on public.settlement_catalog to authenticated;
notify pgrst, 'reload schema';
