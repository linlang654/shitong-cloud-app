-- Target business project: bjlimqtrkdokmjpdcraa
-- Keep historical conclusions unclassified. New reports start as pending.
begin;

alter table public.exception_tickets add column if not exists handling_decision text;
alter table public.exception_tickets alter column handling_decision set default 'pending';

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.exception_tickets'::regclass and conname = 'exception_tickets_handling_decision_check') then
    alter table public.exception_tickets add constraint exception_tickets_handling_decision_check
      check (handling_decision is null or handling_decision in ('pending', 'wash_approved', 'return_wash', 'rewash', 'other'));
  end if;
end;
$$;

create or replace function public.save_exception_ticket_handling(
  p_ticket_id uuid,
  p_status text,
  p_decision text,
  p_customer_reply text,
  p_resolution text,
  p_expected_updated_at timestamptz,
  p_expected_assignee_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_ticket public.exception_tickets%rowtype;
  v_item public.order_items%rowtype;
  v_now timestamptz := clock_timestamp();
  v_reason text := btrim(coalesce(p_resolution, ''), E' \t\n\r');
  v_label text;
  v_return_key text;
begin
  if v_user is null or not exists (select 1 from public.profiles where id = v_user and role = 'admin') then
    raise exception '只有管理员可以设置工单处理结论' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('待客服', '待客户', '处理中', '已解决', '已关闭') then
    raise exception '工单状态无效';
  end if;
  if p_decision is null or p_decision not in ('pending', 'wash_approved', 'return_wash', 'rewash', 'other') then
    raise exception '请选择处理结论';
  end if;
  if p_status in ('已解决', '已关闭') and p_decision = 'pending' then
    raise exception '待确认的工单不能直接结案，请选择处理结论';
  end if;
  if p_decision in ('return_wash', 'other') and v_reason = '' then
    raise exception '请填写退洗原因或其他处理说明';
  end if;

  select * into v_ticket from public.exception_tickets where id = p_ticket_id for update;
  if not found then raise exception '工单不存在或无权读取'; end if;
  if p_expected_updated_at is null or v_ticket.updated_at is distinct from p_expected_updated_at
     or v_ticket.assignee_id is distinct from p_expected_assignee_id then
    raise exception '工单已被更新，请关闭后重新打开核对' using errcode = '40001';
  end if;

  if v_ticket.item_id is not null then
    select * into v_item from public.order_items where id = v_ticket.item_id and order_id = v_ticket.order_id for update;
  end if;
  if p_decision = 'return_wash' and v_item.id is null then
    raise exception '工单没有绑定有效水洗标，不能同步退洗';
  end if;
  if p_decision in ('wash_approved', 'rewash') and
     (v_item.wash_decision in ('return_pending', 'returned', 'return_cancelled') or v_item.item_status = '退洗') then
    raise exception '物品已在退洗流程中，请先核对物品的退洗处理，不能直接改为继续清洗';
  end if;

  if p_decision = 'return_wash' then
    if v_item.wash_decision in ('returned', 'return_cancelled') then
      v_return_key := v_item.wash_decision;
      update public.order_items set wash_decision_reason = v_reason,
        wash_decision_updated_by = v_user, wash_decision_updated_at = v_now, updated_at = v_now
      where id = v_item.id;
    else
      if v_item.item_status in ('已出库', '配送中', '已送达') then
        raise exception '物品已出库或送达，请通过送回流程处理，不能倒退为待退洗';
      end if;
      v_return_key := case when v_item.item_status in ('待取件', '待补取', '未找到') then 'return_cancelled' else 'return_pending' end;
      update public.order_items set item_status = '退洗', wash_decision = v_return_key,
        price_adjustment_type = 'none', price_adjustment_amount = 0, wash_decision_reason = v_reason,
        wash_decision_updated_by = v_user, wash_decision_updated_at = v_now, updated_at = v_now
      where id = v_item.id;
    end if;
    if v_return_key = 'return_cancelled' then
      if to_regclass('public.pickup_retry_tasks') is not null then
        update public.pickup_retry_tasks set status = '已取消', updated_at = v_now
        where item_id = v_item.id and status in ('待补取', '未找到');
      end if;
      update public.return_tasks set status = '已取消', updated_at = v_now
      where item_id = v_item.id and status <> '已送达';
    end if;
  end if;

  v_label := case p_decision when 'pending' then '待确认' when 'wash_approved' then '同意清洗'
    when 'return_wash' then '退洗' when 'rewash' then '返洗' else '其他处理' end;
  update public.exception_tickets set status = p_status, handling_decision = p_decision,
    customer_reply = coalesce(p_customer_reply, ''),
    resolution = case when p_decision <> 'pending' then coalesce(nullif(v_reason, ''), v_label) else v_reason end,
    assignee_id = coalesce(assignee_id, v_user), updated_at = v_now,
    resolved_at = case when p_status in ('已解决', '已关闭') then coalesce(resolved_at, v_now) else null end
  where id = v_ticket.id;

  insert into public.status_logs(order_id, item_id, barcode, status, note, operator_id)
  values (v_ticket.order_id, v_ticket.item_id,
    case when coalesce(v_item.barcode, v_ticket.barcode, '') like 'pending:%' then null else nullif(coalesce(v_item.barcode, v_ticket.barcode), '') end,
    '异常工单' || p_status,
    '处理结论：' || v_label || case when v_reason <> '' then '；说明：' || v_reason else '' end
      || case when btrim(coalesce(p_customer_reply, '')) <> '' then '；客户回复：' || p_customer_reply else '' end,
    v_user);

  return jsonb_build_object('ticket_id', v_ticket.id, 'handling_decision', p_decision,
    'status', p_status, 'updated_at', v_now, 'item_id', v_item.id, 'wash_decision', v_return_key);
end;
$$;

revoke all on function public.save_exception_ticket_handling(uuid,text,text,text,text,timestamptz,uuid) from public, anon;
grant execute on function public.save_exception_ticket_handling(uuid,text,text,text,text,timestamptz,uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
