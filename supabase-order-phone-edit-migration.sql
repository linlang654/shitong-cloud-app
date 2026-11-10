begin;

-- Keep employee status updates working, while restricting phone changes.
create or replace function public.require_admin_for_order_phone_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.phone is distinct from old.phone
    and (current_user in ('anon', 'authenticated') or auth.role() in ('anon', 'authenticated') or auth.uid() is not null)
    and public.current_user_role() is distinct from 'admin' then
    raise exception '只有管理员可以修改订单联系电话。' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.require_admin_for_order_phone_change() from public, anon, authenticated;

create or replace trigger order_phone_change_admin_only
before update of phone on public.orders
for each row execute function public.require_admin_for_order_phone_change();

commit;
