-- 事事通洗护：单个水洗标补差 / 退洗功能
-- 仅新增字段，不删除或改写现有订单数据；历史水洗标默认为正常洗护。

alter table public.order_items add column if not exists wash_decision text not null default 'normal';
alter table public.order_items add column if not exists price_adjustment_type text not null default 'none';
alter table public.order_items add column if not exists price_adjustment_amount numeric(10,2) not null default 0;
alter table public.order_items add column if not exists wash_decision_reason text not null default '';
alter table public.order_items add column if not exists wash_decision_note text not null default '';
alter table public.order_items add column if not exists wash_decision_updated_by uuid references public.profiles(id);
alter table public.order_items add column if not exists wash_decision_updated_at timestamptz;

create index if not exists order_items_wash_decision_idx
on public.order_items(wash_decision)
where wash_decision <> 'normal';

comment on column public.order_items.wash_decision is 'normal=正常；supplement_pending=待补差；supplement_confirmed=已补差继续洗；return_pending=不洗待退回；returned=已退洗';
comment on column public.order_items.price_adjustment_type is 'none=无差价；supplement=补收；refund=退还';
