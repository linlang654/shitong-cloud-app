begin;

alter table public.return_tasks
  add column if not exists delivery_short_code text not null default '';

create index if not exists return_tasks_delivery_short_code_idx
  on public.return_tasks(delivery_short_code)
  where delivery_short_code <> '';

create or replace function public.get_return_delivery_proof(target_code text)
returns table (
  delivery_photo_path text,
  delivered_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select rt.delivery_photo_path, rt.delivered_at
  from public.return_tasks rt
  where rt.delivery_short_code = lower(trim(target_code))
    and rt.status = '已送达'
    and rt.delivery_photo_path <> ''
  order by rt.delivered_at desc nulls last
  limit 1;
$$;

revoke all on function public.get_return_delivery_proof(text) from public;
grant execute on function public.get_return_delivery_proof(text) to anon, authenticated;

comment on column public.return_tasks.delivery_short_code is '送达照片公开短链接随机码';
comment on function public.get_return_delivery_proof(text) is '通过随机短码公开读取送达照片路径，不返回订单或客户信息';

commit;
