-- 事事通洗护：单个水洗标补取任务
-- 增量迁移，不删除订单或现有取件任务。

create table if not exists public.pickup_retry_tasks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id uuid not null references public.order_items(id) on delete cascade,
  parent_pickup_task_id uuid references public.pickup_tasks(id) on delete set null,
  exception_ticket_id uuid references public.exception_tickets(id) on delete set null,
  pickup_date date not null default ((now() at time zone 'Asia/Shanghai')::date),
  status text not null default '待补取' check (status in ('待补取', '未找到', '已补取', '已取消')),
  reason text not null default '',
  attempt_no integer not null default 1 check (attempt_no > 0),
  operator_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pickup_retry_tasks_route_idx
on public.pickup_retry_tasks(status, pickup_date, created_at);

create index if not exists pickup_retry_tasks_order_idx
on public.pickup_retry_tasks(order_id, created_at desc);

create unique index if not exists pickup_retry_tasks_one_open_per_item_idx
on public.pickup_retry_tasks(item_id)
where status in ('待补取', '未找到');

alter table public.pickup_retry_tasks enable row level security;

drop policy if exists "employees read pickup retry tasks" on public.pickup_retry_tasks;
drop policy if exists "admin courier create pickup retry tasks" on public.pickup_retry_tasks;
drop policy if exists "admin courier update pickup retry tasks" on public.pickup_retry_tasks;

create policy "employees read pickup retry tasks" on public.pickup_retry_tasks
for select using (auth.role() = 'authenticated');

create policy "admin courier create pickup retry tasks" on public.pickup_retry_tasks
for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'courier'))
);

create policy "admin courier update pickup retry tasks" on public.pickup_retry_tasks
for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'courier'))
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'courier'))
);

grant select, insert, update on public.pickup_retry_tasks to authenticated;

-- order_items.item_status 继续作为唯一物品流转来源；待补取不回退已经取到的其他水洗标。
create or replace function public.derive_order_status(target_order_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when count(*) = 0 then '待取件'
    when bool_or(item_status = '异常') then '异常'
    when bool_or(item_status = '待补取') then '待补取'
    when bool_or(item_status = '未找到') then '未找到'
    else case min(
      case item_status
        when '待取件' then 0
        when '已取件' then 1
        when '已入厂' then 2
        when '清洗中' then 2
        when '已出库' then 3
        when '配送中' then 4
        when '已送达' then 5
        else 0
      end
    )
      when 0 then '待取件'
      when 1 then '已取件'
      when 2 then '已入厂'
      when 3 then '已出库'
      when 4 then '配送中'
      when 5 then '已送达'
      else '待取件'
    end
  end
  from public.order_items
  where order_id = target_order_id;
$$;

create or replace function public.sync_order_flow_state(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status text;
begin
  if target_order_id is null then return; end if;
  next_status := public.derive_order_status(target_order_id);

  update public.orders
  set order_status = next_status,
      updated_at = now()
  where id = target_order_id
    and order_status is distinct from next_status;

  update public.pickup_tasks
  set status = case
        when next_status = '待取件' then '待取件'
        when next_status = '未找到' then '未找到'
        when next_status in ('待补取', '异常') then status
        else '已取件'
      end,
      updated_at = now()
  where order_id = target_order_id
    and status is distinct from case
      when next_status = '待取件' then '待取件'
      when next_status = '未找到' then '未找到'
      when next_status in ('待补取', '异常') then status
      else '已取件'
    end;
end;
$$;

create or replace function public.sync_flow_from_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_order_id uuid;
  return_status text;
begin
  affected_order_id := case when tg_op = 'DELETE' then old.order_id else new.order_id end;

  if tg_op <> 'DELETE' then
    if new.item_status in ('待取件', '待补取', '已取件', '已入厂', '清洗中', '未找到') then
      delete from public.return_tasks where item_id = new.id;
    elsif new.item_status in ('已出库', '配送中', '已送达') then
      return_status := case new.item_status when '已出库' then '待送回' else new.item_status end;
      insert into public.return_tasks (item_id, outbound_date, status, updated_at)
      values (new.id, (now() at time zone 'Asia/Shanghai')::date, return_status, now())
      on conflict (item_id) do update
      set status = excluded.status,
          updated_at = excluded.updated_at;
    elsif new.item_status = '异常' then
      update public.return_tasks set status = '异常', updated_at = now() where item_id = new.id;
    end if;
  end if;

  perform public.sync_order_flow_state(affected_order_id);
  if tg_op = 'UPDATE' and old.order_id is distinct from new.order_id then
    perform public.sync_order_flow_state(old.order_id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
