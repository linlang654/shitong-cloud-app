-- 事事通洗护：统一异常工单中心
-- 保留原“地址异常修正”，新增按订单/水洗标上报、分派、沟通与结案能力。

create table if not exists public.exception_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id uuid references public.order_items(id) on delete set null,
  barcode text not null default '',
  ticket_type text not null default '其他异常',
  description text not null default '',
  proposed_solution text not null default '',
  customer_reply text not null default '',
  resolution text not null default '',
  evidence_paths text[] not null default '{}',
  status text not null default '待客服' check (status in ('待客服', '待客户', '处理中', '已解决', '已关闭')),
  priority text not null default '普通' check (priority in ('普通', '紧急')),
  source text not null default '后台',
  reporter_id uuid references public.profiles(id),
  assignee_id uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exception_tickets_open_idx
on public.exception_tickets(status, created_at desc)
where status in ('待客服', '待客户', '处理中');

create index if not exists exception_tickets_order_idx on public.exception_tickets(order_id);
create index if not exists exception_tickets_item_idx on public.exception_tickets(item_id);
create index if not exists exception_tickets_barcode_idx on public.exception_tickets(barcode);

alter table public.exception_tickets enable row level security;

drop policy if exists "employees read exception tickets" on public.exception_tickets;
drop policy if exists "employees create exception tickets" on public.exception_tickets;
drop policy if exists "employees update exception tickets" on public.exception_tickets;

create policy "employees read exception tickets" on public.exception_tickets
for select using (auth.role() = 'authenticated');

create policy "employees create exception tickets" on public.exception_tickets
for insert with check (auth.role() = 'authenticated');

create policy "employees update exception tickets" on public.exception_tickets
for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

grant select, insert, update on public.exception_tickets to authenticated;

-- 异常照片使用私有存储桶，只允许已登录员工读写。
insert into storage.buckets (id, name, public)
values ('exception-evidence', 'exception-evidence', false)
on conflict (id) do update set public = false;

drop policy if exists "employees read exception evidence" on storage.objects;
drop policy if exists "employees upload exception evidence" on storage.objects;
drop policy if exists "employees update exception evidence" on storage.objects;

create policy "employees read exception evidence" on storage.objects
for select using (bucket_id = 'exception-evidence' and auth.role() = 'authenticated');

create policy "employees upload exception evidence" on storage.objects
for insert with check (bucket_id = 'exception-evidence' and auth.role() = 'authenticated');
