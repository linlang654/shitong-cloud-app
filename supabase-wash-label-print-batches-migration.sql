-- Apply after supabase-wash-label-first-issue-migration.sql in bjlimqtrkdokmjpdcraa.

begin;

create or replace function public.issue_wash_label_barcodes_for_print(
  p_prefixes text[],
  p_ordered_item_ids uuid[],
  p_route_snapshots jsonb,
  p_require_all_pending boolean
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

  if v_requested_pending_count <> v_requested_count or (p_require_all_pending and exists (
    select 1
    from public.order_items i
    where i.barcode like 'pending:%'
      and split_part(i.barcode, ':', 2) = any(p_prefixes)
      and not (i.id = any(p_ordered_item_ids))
  )) then
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

revoke all on function public.issue_wash_label_barcodes_for_print(text[], uuid[], jsonb, boolean) from public, anon, authenticated, service_role;

-- Preserve the old export and import preflight contract for existing pages.
create or replace function public.issue_wash_label_barcodes(
  p_prefixes text[],
  p_ordered_item_ids uuid[],
  p_route_snapshots jsonb
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.issue_wash_label_barcodes_for_print(p_prefixes, p_ordered_item_ids, p_route_snapshots, true);
$$;

create table if not exists public.wash_label_print_batches (
  id uuid primary key,
  print_date date not null,
  batch_number integer not null check (batch_number > 0),
  created_at timestamptz not null default now(),
  created_by uuid not null,
  unique (print_date, batch_number)
);

alter table public.wash_label_print_batches enable row level security;
revoke all on public.wash_label_print_batches from public, anon, authenticated, service_role;
grant select on public.wash_label_print_batches to authenticated;

drop policy if exists "admins read wash label print batches" on public.wash_label_print_batches;
create policy "admins read wash label print batches" on public.wash_label_print_batches
for select to authenticated using ((select public.current_user_role()) = 'admin');

alter table public.order_items
  add column if not exists wash_label_print_batch_id uuid references public.wash_label_print_batches(id),
  add column if not exists wash_label_print_position integer;

create unique index if not exists order_items_wash_label_print_position_idx
on public.order_items (wash_label_print_batch_id, wash_label_print_position)
where wash_label_print_batch_id is not null;

create or replace function public.guard_wash_label_print_batch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated', 'service_role') then
    if tg_op = 'INSERT' then
      if new.wash_label_print_batch_id is not null or new.wash_label_print_position is not null then
        raise exception '水洗标打印批次只能通过新建打印批次分配。' using errcode = '42501';
      end if;
    elsif row(new.wash_label_print_batch_id, new.wash_label_print_position) is distinct from
          row(old.wash_label_print_batch_id, old.wash_label_print_position) then
      raise exception '已保存的水洗标打印批次不能直接修改。' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_wash_label_print_batch() from public, anon, authenticated, service_role;

create or replace trigger order_item_wash_label_print_batch_only
before insert or update of wash_label_print_batch_id, wash_label_print_position on public.order_items
for each row execute function public.guard_wash_label_print_batch();

create or replace function public.create_wash_label_print_batch(
  p_batch_id uuid,
  p_ordered_item_ids uuid[],
  p_route_snapshots jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.wash_label_print_batches;
  v_print_date date := (statement_timestamp() at time zone 'Asia/Shanghai')::date;
  v_pending_ids uuid[];
  v_pending_prefixes text[];
  v_labels jsonb;
begin
  if auth.uid() is null or public.current_user_role() is distinct from 'admin' then
    raise exception '只有管理员可以新建水洗标打印批次。' using errcode = '42501';
  end if;

  if p_batch_id is null or coalesce(cardinality(p_ordered_item_ids), 0) = 0
    or (select count(distinct request.id) from unnest(p_ordered_item_ids) as request(id)) <> cardinality(p_ordered_item_ids)
    or jsonb_typeof(p_route_snapshots) is distinct from 'object' then
    raise exception '请选择需要打印的水洗标。' using errcode = '22023';
  end if;

  -- Share the lock used by the original numbering flow. It protects both the
  -- daily print batch number and the per-prefix barcode counters.
  lock table public.order_items in share row exclusive mode;

  select * into v_batch from public.wash_label_print_batches where id = p_batch_id;
  if found then
    if (select array_agg(i.id order by i.wash_label_print_position)
        from public.order_items i where i.wash_label_print_batch_id = p_batch_id)
       is distinct from p_ordered_item_ids then
      raise exception '打印批次内容已变化，请刷新后选择已保存的批次补打。' using errcode = '40001';
    end if;
  else
    if (select count(*) from public.order_items i where i.id = any(p_ordered_item_ids)
        and i.wash_label_print_batch_id is null and nullif(i.barcode, '') is not null
        and (i.barcode not like 'pending:%' or i.barcode ~ '^pending:[0-9]{6}:')) <> cardinality(p_ordered_item_ids) then
      raise exception '所选水洗标已分批或已移除，请刷新后重新选择，已分批的水洗标可直接补打。' using errcode = '40001';
    end if;

    perform o.id from public.orders o
    where o.id in (select i.order_id from public.order_items i where i.id = any(p_ordered_item_ids))
    order by o.id for share;

    if exists (
      select 1 from public.order_items i
      join public.orders o on o.id = i.order_id
      where i.id = any(p_ordered_item_ids)
        and (p_route_snapshots -> i.id::text) is distinct from jsonb_build_array(o.school, o.campus, o.building)
    ) then
      raise exception '所选水洗标的学校、校区或楼栋已变化，请刷新后重新选择。' using errcode = '40001';
    end if;

    select array_agg(i.id order by request.position), array_agg(distinct split_part(i.barcode, ':', 2))
      into v_pending_ids, v_pending_prefixes
    from unnest(p_ordered_item_ids) with ordinality as request(id, position)
    join public.order_items i on i.id = request.id
    where i.barcode like 'pending:%';

    if v_pending_ids is not null then
      perform public.issue_wash_label_barcodes_for_print(v_pending_prefixes, v_pending_ids, p_route_snapshots, false);
    end if;

    insert into public.wash_label_print_batches (id, print_date, batch_number, created_by)
    select p_batch_id, v_print_date, coalesce(max(batch_number), 0) + 1, auth.uid()
    from public.wash_label_print_batches where print_date = v_print_date
    returning * into v_batch;

    update public.order_items i
    set wash_label_print_batch_id = p_batch_id, wash_label_print_position = request.position::integer
    from unnest(p_ordered_item_ids) with ordinality as request(id, position)
    where i.id = request.id;
  end if;

  select jsonb_agg(jsonb_build_object('item_id', i.id, 'barcode', i.barcode) order by i.wash_label_print_position)
    into v_labels
  from public.order_items i where i.wash_label_print_batch_id = p_batch_id;

  return jsonb_build_object('id', v_batch.id, 'print_date', v_batch.print_date,
    'batch_number', v_batch.batch_number, 'labels', v_labels);
end;
$$;

revoke all on function public.create_wash_label_print_batch(uuid, uuid[], jsonb) from public, anon, authenticated, service_role;
grant execute on function public.create_wash_label_print_batch(uuid, uuid[], jsonb) to authenticated;

notify pgrst, 'reload schema';

commit;
