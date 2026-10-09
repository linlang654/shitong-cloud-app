-- Unpicked return-wash items can be closed directly without creating a factory return task.
-- Run after the existing status-flow and return-wash migrations.

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
    when bool_or(item_status = '未找到') then '未找到'
    when bool_and(item_status = '退洗' and wash_decision = 'return_cancelled') then '已退单'
    when bool_and(item_status = '已送达') then '已送达'
    when bool_and(item_status = '已送达' or (item_status = '退洗' and wash_decision = 'return_cancelled'))
      and bool_or(item_status = '退洗' and wash_decision = 'return_cancelled') then '已完结'
    else case min(
      case item_status
        when '待取件' then 0
        when '待补取' then 0
        when '已取件' then 1
        when '已入厂' then 2
        when '清洗中' then 2
        when '已出库' then 3
        when '配送中' then 4
        when '已送达' then 5
        when '退洗' then case when wash_decision = 'return_cancelled' then 5 else 2 end
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
        when next_status = '已退单' then '已取消'
        when next_status = '异常' then status
        else '已取件'
      end,
      updated_at = now()
  where order_id = target_order_id
    and status is distinct from case
      when next_status = '待取件' then '待取件'
      when next_status = '未找到' then '未找到'
      when next_status = '已退单' then '已取消'
      when next_status = '异常' then status
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
    if new.item_status = '退洗' and new.wash_decision = 'return_cancelled' then
      update public.pickup_retry_tasks
      set status = '已取消', updated_at = now()
      where item_id = new.id and status in ('待补取', '未找到');
      update public.return_tasks
      set status = '已取消', updated_at = now()
      where item_id = new.id and status <> '已送达';
    elsif new.item_status in ('待取件', '待补取', '已取件', '已入厂', '清洗中', '未找到') then
      delete from public.return_tasks where item_id = new.id;
    elsif new.item_status in ('已出库', '配送中', '已送达') then
      return_status := case new.item_status when '已出库' then '待送回' else new.item_status end;
      insert into public.return_tasks (item_id, outbound_date, status, updated_at)
      values (new.id, (now() at time zone 'Asia/Shanghai')::date, return_status, now())
      on conflict (item_id) do update
      set status = excluded.status, updated_at = excluded.updated_at;
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

-- Directly cancelled pickup/return flows should no longer appear in staff work queues.
update public.pickup_retry_tasks retry
set status = '已取消', updated_at = now()
from public.order_items item
where retry.item_id = item.id
  and item.item_status = '退洗'
  and item.wash_decision = 'return_cancelled'
  and retry.status in ('待补取', '未找到');

update public.return_tasks task
set status = '已取消', updated_at = now()
from public.order_items item
where task.item_id = item.id
  and item.item_status = '退洗'
  and item.wash_decision = 'return_cancelled'
  and task.status <> '已送达';

-- Recalculate existing orders after installing the new terminal-state rules.
select public.sync_order_flow_state(id)
from public.orders
where exists (
  select 1 from public.order_items
  where order_id = public.orders.id and item_status = '退洗'
);
