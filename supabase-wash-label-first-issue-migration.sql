begin;

-- Apply to the active business project bjlimqtrkdokmjpdcraa before deploying its frontend.
-- Existing barcodes are already issued. Only pending:YYMMDD:UUID codes can be assigned.
lock table public.order_items in share row exclusive mode;

create table if not exists public.wash_label_barcode_counters (
  prefix text primary key check (prefix ~ '^[0-9]{6}$'),
  last_number numeric not null check (last_number >= 0)
);

alter table public.wash_label_barcode_counters enable row level security;
revoke all on table public.wash_label_barcode_counters from public, anon, authenticated, service_role;

-- Keep the last issued number even when an import batch and its items are deleted.
insert into public.wash_label_barcode_counters as c (prefix, last_number)
select left(i.barcode, 6), max(substr(i.barcode, 7)::numeric)
from public.order_items i
where i.barcode ~ '^[0-9]{9,}$'
group by left(i.barcode, 6)
on conflict (prefix) do update set last_number = greatest(c.last_number, excluded.last_number);

create or replace function public.guard_wash_label_barcode_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.barcode is distinct from old.barcode
    and current_user in ('anon', 'authenticated', 'service_role') then
    raise exception '水洗标条码只能通过首次打印分配。' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_wash_label_barcode_update() from public, anon, authenticated, service_role;

create or replace trigger order_item_barcode_issue_only
before update of barcode on public.order_items
for each row execute function public.guard_wash_label_barcode_update();

create or replace function public.issue_wash_label_barcodes(
  p_prefixes text[],
  p_ordered_item_ids uuid[],
  p_route_snapshots jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requested_count integer := cardinality(p_ordered_item_ids);
  v_requested_pending_count integer;
  v_requested_issued_count integer;
  v_issued_labels jsonb;
begin
  if auth.uid() is null or public.current_user_role() is distinct from 'admin' then
    raise exception '只有管理员可以分配水洗标条码。' using errcode = '42501';
  end if;

  if cardinality(p_prefixes) = 0 and v_requested_count = 0 and p_route_snapshots = '{}'::jsonb then
    return '[]'::jsonb;
  end if;

  if coalesce(cardinality(p_prefixes), 0) = 0 or coalesce(v_requested_count, 0) = 0
    or exists (select 1 from unnest(p_prefixes) as p(prefix) where p.prefix is null or p.prefix !~ '^[0-9]{6}$')
    or (select count(distinct p.prefix) from unnest(p_prefixes) as p(prefix)) <> cardinality(p_prefixes)
    or (select count(distinct request.id) from unnest(p_ordered_item_ids) as request(id)) <> v_requested_count
    or jsonb_typeof(p_route_snapshots) is distinct from 'object' then
    raise exception '水洗标批次、物品或楼栋信息不完整。' using errcode = '22023';
  end if;

  -- Serialize issuance and block inserts/updates from old import pages until the mapping is committed.
  lock table public.order_items in share row exclusive mode;

  select count(*) filter (where i.barcode like 'pending:%' and split_part(i.barcode, ':', 2) = any(p_prefixes)),
         count(*) filter (where i.barcode ~ '^[0-9]{9,}$' and left(i.barcode, 6) = any(p_prefixes))
    into v_requested_pending_count, v_requested_issued_count
  from public.order_items i
  where i.id = any(p_ordered_item_ids);

  -- The first response may have been lost after commit. Preserve the mapping even if later imports added items.
  if v_requested_issued_count = v_requested_count then
    select jsonb_agg(jsonb_build_object('item_id', i.id, 'barcode', i.barcode) order by request.position)
      into v_issued_labels
    from unnest(p_ordered_item_ids) with ordinality as request(id, position)
    join public.order_items i on i.id = request.id;
    return v_issued_labels;
  end if;

  if v_requested_pending_count <> v_requested_count or exists (
    select 1
    from public.order_items i
    where i.barcode like 'pending:%'
      and split_part(i.barcode, ':', 2) = any(p_prefixes)
      and not (i.id = any(p_ordered_item_ids))
  ) then
    raise exception '待分配水洗标已变化，请刷新后重新导出。' using errcode = '40001';
  end if;

  -- Keep the addresses stable from validation through assignment.
  perform o.id
  from public.orders o
  where o.id in (select i.order_id from public.order_items i where i.id = any(p_ordered_item_ids))
  order by o.id
  for share;

  if exists (
    select 1
    from public.order_items i
    join public.orders o on o.id = i.order_id
    where i.id = any(p_ordered_item_ids)
      and (p_route_snapshots -> i.id::text) is distinct from jsonb_build_array(o.school, o.campus, o.building)
  ) then
    raise exception '水洗标的学校、校区或楼栋已变化，请刷新后重新导出。' using errcode = '40001';
  end if;

  with ordered_items as (
    select i.id, i.barcode as old_barcode, split_part(i.barcode, ':', 2) as prefix, request.position,
           row_number() over (partition by split_part(i.barcode, ':', 2) order by request.position) as route_number
    from unnest(p_ordered_item_ids) with ordinality as request(id, position)
    join public.order_items i on i.id = request.id
  ), counters as (
    select p.prefix, greatest(coalesce(c.last_number, 0), coalesce(max(substr(i.barcode, 7)::numeric), 0)) as last_number
    from unnest(p_prefixes) as p(prefix)
    left join public.wash_label_barcode_counters c on c.prefix = p.prefix
    left join public.order_items i on i.barcode like p.prefix || '%' and i.barcode ~ '^[0-9]{9,}$'
    group by p.prefix, c.last_number
  ), planned as (
    select o.*, (c.last_number + o.route_number)::text as next_number
    from ordered_items o
    join counters c on c.prefix = o.prefix
  ), issued as (
    update public.order_items i
    set barcode = p.prefix || lpad(p.next_number, greatest(3, length(p.next_number)), '0')
    from planned p
    where i.id = p.id
    returning i.id, i.barcode, p.old_barcode, p.position, p.prefix, p.next_number::numeric as sequence_number
  ), advanced_counters as (
    insert into public.wash_label_barcode_counters as c (prefix, last_number)
    select i.prefix, max(i.sequence_number)
    from issued i
    group by i.prefix
    on conflict (prefix) do update set last_number = greatest(c.last_number, excluded.last_number)
  ), updated_logs as (
    update public.status_logs l
    set barcode = i.barcode
    from issued i
    where l.item_id = i.id
      and (l.barcode = i.old_barcode or (l.barcode is null and l.status = '待取件'))
  )
  select jsonb_agg(jsonb_build_object('item_id', i.id, 'barcode', i.barcode) order by i.position)
    into v_issued_labels
  from issued i;

  return v_issued_labels;
end;
$$;

revoke all on function public.issue_wash_label_barcodes(text[], uuid[], jsonb) from public, anon, authenticated, service_role;
grant execute on function public.issue_wash_label_barcodes(text[], uuid[], jsonb) to authenticated;

commit;
