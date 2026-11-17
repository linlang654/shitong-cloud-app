-- Apply to the current business project bjlimqtrkdokmjpdcraa before publishing build 94.
begin;

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists orders_created_at_id_idx on public.orders (created_at desc, id);

create or replace function public.search_admin_orders(
  p_keyword text,
  p_status text,
  p_start_date date,
  p_end_date date,
  p_overdue text,
  p_offset integer
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  keyword text := lower(btrim(coalesce(p_keyword, '')));
  page_offset integer := greatest(coalesce(p_offset, 0), 0);
  page_result jsonb;
begin
  if auth.uid() is null or public.current_user_role() is distinct from 'admin' then
    raise exception '只有管理员可以查询后台订单。' using errcode = '42501';
  end if;

  with matched as materialized (
    select o.id, o.created_at
    from public.orders o
    where (nullif(p_status, '') is null or o.order_status = p_status)
      and (p_start_date is null or coalesce(o.pay_time, o.order_time) >= (p_start_date::timestamp at time zone 'Asia/Shanghai'))
      and (p_end_date is null or coalesce(o.pay_time, o.order_time) < ((p_end_date + 1)::timestamp at time zone 'Asia/Shanghai'))
      and case coalesce(p_overdue, '')
        when '' then true
        else o.order_status not in ('已送达', '已退单', '已完结')
          and o.updated_at < now() - interval '48 hours'
          and case p_overdue
            when 'overdue' then true
            when 'overdue-2' then o.updated_at > now() - interval '72 hours'
            when 'overdue-3-5' then o.updated_at <= now() - interval '72 hours' and o.updated_at > now() - interval '120 hours'
            when 'overdue-5-plus' then o.updated_at <= now() - interval '120 hours'
            else false
          end
      end
      and (keyword = ''
        or strpos(lower(concat_ws(' ', o.order_no, o.customer_name, o.phone, o.school, o.campus,
          concat(o.school, o.campus, o.building), o.building, o.address,
          case when o.source = 'douyin' then '抖音团购' end,
          case
            when o.school ~ '民族|民大' and o.campus ~ '贵山|南校区|南区' then '贵山校区'
            when o.school ~ '民族|民大' and o.campus ~ '百川|北校区|北区' then '百川校区'
            when o.school in ('中医', '贵中医', '贵州中医药大学') and o.campus ~ '大学城医院|医院校区' then '大学城医院校区'
            when o.school in ('中医', '贵中医', '贵州中医药大学') and o.campus ~ '花溪|宿舍区' then '花溪校区'
          end
        )), keyword) > 0
        or exists (
          select 1 from public.order_items i
          where i.order_id = o.id
            and strpos(lower(concat_ws(' ', i.barcode, i.product_name, i.spec)), keyword) > 0
        )
      )
  ), page_ids as (
    select id, created_at from matched order by created_at desc, id limit 50 offset page_offset
  ), page_rows as (
    select o.id, o.order_no, o.customer_name, o.phone, o.school, o.campus, o.building,
      o.source, o.order_status, o.created_at, o.updated_at, o.pay_time, o.order_time,
      (select count(*) from public.order_items i where i.order_id = o.id) as item_count
    from page_ids p join public.orders o on o.id = p.id
  )
  select jsonb_build_object(
    'total', (select count(*) from matched),
    'rows', coalesce(jsonb_agg(to_jsonb(page_rows) order by created_at desc, id), '[]'::jsonb)
  ) into page_result
  from page_rows;

  return page_result;
end;
$$;

revoke all on function public.search_admin_orders(text, text, date, date, text, integer) from public, anon, service_role;
grant execute on function public.search_admin_orders(text, text, date, date, text, integer) to authenticated;

notify pgrst, 'reload schema';
commit;
