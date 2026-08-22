-- 统一流转状态：order_items.item_status 是唯一明细来源。
-- orders.order_status 由同一订单下全部水洗标自动汇总；取件、送回任务随明细状态同步。

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
        when next_status = '异常' then status
        else '已取件'
      end,
      updated_at = now()
  where order_id = target_order_id
    and status is distinct from case
      when next_status = '待取件' then '待取件'
      when next_status = '未找到' then '未找到'
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
    if new.item_status in ('待取件', '已取件', '已入厂', '清洗中', '未找到') then
      delete from public.return_tasks where item_id = new.id;
    elsif new.item_status in ('已出库', '配送中', '已送达') then
      return_status := case new.item_status
        when '已出库' then '待送回'
        else new.item_status
      end;
      insert into public.return_tasks (item_id, outbound_date, status, updated_at)
      values (new.id, (now() at time zone 'Asia/Shanghai')::date, return_status, now())
      on conflict (item_id) do update
      set status = excluded.status,
          updated_at = excluded.updated_at;
    elsif new.item_status = '异常' then
      update public.return_tasks
      set status = '异常', updated_at = now()
      where item_id = new.id;
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

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'order_items_sync_flow_state'
      and tgrelid = 'public.order_items'::regclass
  ) then
    execute 'create trigger order_items_sync_flow_state
      after insert or update of item_status, order_id or delete
      on public.order_items
      for each row execute function public.sync_flow_from_order_item()';
  end if;
end;
$$;

-- 安装时立即修复已有数据。
do $$
declare
  current_order record;
begin
  for current_order in select id from public.orders loop
    perform public.sync_order_flow_state(current_order.id);
  end loop;
end;
$$;

insert into public.return_tasks (item_id, outbound_date, status, updated_at)
select
  item.id,
  (now() at time zone 'Asia/Shanghai')::date,
  case item.item_status when '已出库' then '待送回' else item.item_status end,
  now()
from public.order_items item
where item.item_status in ('已出库', '配送中', '已送达')
on conflict (item_id) do update
set status = excluded.status,
    updated_at = excluded.updated_at;
