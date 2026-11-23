-- Only apply to business project bjlimqtrkdokmjpdcraa, after build 103 migration.
begin;
alter table public.exception_tickets
  add column if not exists target_team text not null default 'customer_service',
  add column if not exists factory_progress text not null default 'pending',
  add column if not exists factory_reply text not null default '',
  add column if not exists factory_handler_id uuid references public.profiles(id),
  add column if not exists factory_replied_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.exception_tickets'::regclass and conname='exception_target_team_check') then
    alter table public.exception_tickets add constraint exception_target_team_check check(target_team in ('customer_service','factory'));
    alter table public.exception_tickets add constraint exception_factory_progress_check check(factory_progress in ('pending','processing','replied'));
  end if;
end $$;
create index if not exists exception_factory_queue_idx on public.exception_tickets(factory_progress,updated_at desc)
  where target_team='factory' and status in ('待客服','待客户','处理中');

-- Keep factory updates inside the scoped RPC; do not broaden the table update policy.
create or replace function public.guard_factory_exception_workflow() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if tg_op='INSERT' and new.target_team='factory' then
    if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then
      raise exception '只有管理员可以向工厂发起工单' using errcode='42501';
    end if;
  elsif tg_op='UPDATE' then
    if new.target_team is distinct from old.target_team then raise exception '工单处理方向不能直接修改'; end if;
    if old.target_team='factory' and new.status in ('已解决','已关闭') and new.factory_progress<>'replied' then
      raise exception '请先等待工厂回复，再由后台确认结案';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_factory_exception_workflow on public.exception_tickets;
create trigger guard_factory_exception_workflow before insert or update on public.exception_tickets
  for each row execute function public.guard_factory_exception_workflow();
revoke all on function public.guard_factory_exception_workflow() from public,anon,authenticated;

create or replace function public.create_factory_exception(
  p_ticket_id uuid,p_item_id uuid,p_ticket_type text,p_description text,p_solution text,p_priority text,p_evidence_paths text[]
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_user uuid:=auth.uid(); v_item public.order_items%rowtype; v_old public.exception_tickets%rowtype;
  v_description text:=btrim(coalesce(p_description,''),E' \t\r\n'); v_now timestamptz:=clock_timestamp();
begin
  if v_user is null or not exists(select 1 from public.profiles where id=v_user and role='admin') then
    raise exception '只有管理员可以向工厂发起工单' using errcode='42501';
  end if;
  if p_ticket_id is null or p_item_id is null or length(v_description) not between 1 and 4000 then
    raise exception '请选择物品并填写问题说明（最多4000字）';
  end if;
  if p_priority is null or p_priority not in ('普通','紧急') or length(coalesce(p_ticket_type,'')) not between 1 and 80
     or length(coalesce(p_solution,''))>1000 then raise exception '工单类型、优先级或建议方案无效'; end if;
  select * into v_item from public.order_items where id=p_item_id for update;
  if not found then raise exception '水洗标对应物品不存在'; end if;
  select * into v_old from public.exception_tickets where id=p_ticket_id;
  if found then
    if v_old.target_team<>'factory' or v_old.reporter_id is distinct from v_user or v_old.item_id is distinct from p_item_id
       or v_old.description<>v_description or v_old.ticket_type<>p_ticket_type then raise exception '提交标识已使用，请刷新后核对'; end if;
    return jsonb_build_object('ticket_id',v_old.id,'target_team','factory');
  end if;
  if exists(select 1 from public.exception_tickets where item_id=v_item.id and target_team='factory'
      and ticket_type=p_ticket_type and status in ('待客服','待客户','处理中')) then
    raise exception '这个水洗标已有同类型发给工厂的待处理工单，请先查看原工单';
  end if;
  if cardinality(coalesce(p_evidence_paths,'{}'))>6 or exists(select 1 from unnest(p_evidence_paths) p
      where p is null or p not like v_item.order_id::text||'/%') then raise exception '异常照片路径无效'; end if;
  insert into public.exception_tickets(id,order_id,item_id,barcode,ticket_type,description,proposed_solution,evidence_paths,
    priority,status,source,reporter_id,assignee_id,target_team,factory_progress,handling_decision,updated_at)
  values(p_ticket_id,v_item.order_id,v_item.id,case when v_item.barcode like 'pending:%' then '' else coalesce(v_item.barcode,'') end,
    p_ticket_type,v_description,coalesce(p_solution,''),coalesce(p_evidence_paths,'{}'),p_priority,'处理中','后台',v_user,v_user,'factory','pending','pending',v_now);
  insert into public.status_logs(order_id,item_id,barcode,status,note,operator_id)
  values(v_item.order_id,v_item.id,nullif(case when v_item.barcode like 'pending:%' then '' else v_item.barcode end,''),
    '异常工单发给工厂',p_ticket_type||'：'||v_description,v_user);
  return jsonb_build_object('ticket_id',p_ticket_id,'target_team','factory');
end $$;

create or replace function public.act_on_factory_exception(p_ticket_id uuid,p_action text,p_message text,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_user uuid:=auth.uid(); v_role text; v_ticket public.exception_tickets%rowtype;
  v_message text:=btrim(coalesce(p_message,''),E' \t\r\n'); v_now timestamptz:=clock_timestamp(); v_progress text;
begin
  select role into v_role from public.profiles where id=v_user;
  if v_user is null or v_role is null or v_role not in ('admin','factory') then raise exception '无权处理工厂工单' using errcode='42501'; end if;
  if p_action is null or p_action not in ('start','reply','reopen') then raise exception '工单操作无效'; end if;
  select * into v_ticket from public.exception_tickets where id=p_ticket_id for update;
  if not found or v_ticket.target_team<>'factory' then raise exception '工单不存在或不是发给工厂的工单'; end if;
  if p_expected_updated_at is null or v_ticket.updated_at is distinct from p_expected_updated_at then
    raise exception '工单已被更新，请关闭后刷新核对' using errcode='40001'; end if;
  if v_ticket.status not in ('待客服','待客户','处理中') then raise exception '工单已结案，不能继续处理'; end if;
  if p_action='reopen' then
    if v_role<>'admin' then raise exception '只有后台可以退回重处理' using errcode='42501'; end if;
    if v_ticket.factory_progress<>'replied' or length(v_message) not between 1 and 4000 then raise exception '请等待工厂回复，并填写重处理原因（最多4000字）'; end if;
    v_progress:='pending';
    update public.exception_tickets set factory_progress=v_progress,factory_handler_id=null,
      proposed_solution=v_message,status='处理中',resolved_at=null,updated_at=v_now where id=v_ticket.id;
  else
    if v_ticket.factory_progress='replied' then raise exception '已提交回复，请等待后台确认'; end if;
    if v_ticket.factory_handler_id is not null and v_ticket.factory_handler_id<>v_user and v_role<>'admin' then
      raise exception '其他工厂同事正在处理，请由原处理人回复'; end if;
    if p_action='start' and v_ticket.factory_progress<>'pending' then raise exception '工单已开始处理，请刷新核对'; end if;
    if p_action='reply' and length(v_message) not between 1 and 4000 then raise exception '请填写处理结果（最多4000字）'; end if;
    v_progress:=case when p_action='reply' then 'replied' else 'processing' end;
    update public.exception_tickets set factory_progress=v_progress,factory_handler_id=coalesce(factory_handler_id,v_user),
      factory_reply=case when p_action='reply' then v_message else factory_reply end,
      factory_replied_at=case when p_action='reply' then v_now else factory_replied_at end,updated_at=v_now where id=v_ticket.id;
  end if;
  insert into public.status_logs(order_id,item_id,barcode,status,note,operator_id)
  values(v_ticket.order_id,v_ticket.item_id,nullif(v_ticket.barcode,''),
    case p_action when 'start' then '工厂开始处理异常' when 'reply' then '工厂已回复，待后台确认' else '后台退回工厂重处理' end,
    case p_action when 'start' then v_ticket.description else v_message end,v_user);
  return jsonb_build_object('ticket_id',v_ticket.id,'factory_progress',v_progress,'updated_at',v_now);
end $$;
revoke all on function public.create_factory_exception(uuid,uuid,text,text,text,text,text[]) from public,anon;
revoke all on function public.act_on_factory_exception(uuid,text,text,timestamptz) from public,anon;
grant execute on function public.create_factory_exception(uuid,uuid,text,text,text,text,text[]) to authenticated;
grant execute on function public.act_on_factory_exception(uuid,text,text,timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;
