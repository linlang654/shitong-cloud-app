-- Apply to bjlimqtrkdokmjpdcraa after the factory exception workflow migration.
begin;

create or replace function public.reply_to_factory_exception_with_photos(
  p_ticket_id uuid,
  p_message text,
  p_expected_updated_at timestamptz,
  p_evidence_paths text[]
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_ticket public.exception_tickets%rowtype;
  v_prefix text;
  v_result jsonb;
begin
  if v_user is null or not exists (
    select 1 from public.profiles where id=v_user and role in ('admin','factory')
  ) then
    raise exception '无权处理工厂工单' using errcode='42501';
  end if;

  select * into v_ticket from public.exception_tickets where id=p_ticket_id for update;
  if not found or v_ticket.target_team<>'factory' then
    raise exception '工单不存在或不是发给工厂的工单';
  end if;
  if coalesce(cardinality(p_evidence_paths),0) not between 1 and 6 then
    raise exception '每次请选择 1 至 6 张照片' using errcode='22023';
  end if;

  v_prefix := v_ticket.order_id::text || '/factory-reply/' || v_ticket.id::text || '/';
  if (
    select count(*) from storage.objects as photo
    where photo.bucket_id='exception-evidence'
      and photo.owner_id=v_user::text
      and photo.name=any(p_evidence_paths)
      and left(photo.name,length(v_prefix))=v_prefix
      and not (photo.name=any(v_ticket.evidence_paths))
  ) <> cardinality(p_evidence_paths) then
    raise exception '处理照片未上传完成或不属于此工单' using errcode='22023';
  end if;

  v_result := public.act_on_factory_exception(
    p_ticket_id, 'reply',
    coalesce(nullif(btrim(coalesce(p_message,''),E' \t\r\n'),''),'已上传工厂处理照片。'),
    p_expected_updated_at
  );
  update public.exception_tickets
  set evidence_paths=evidence_paths || p_evidence_paths
  where id=p_ticket_id;
  return v_result;
end $$;

revoke all on function public.reply_to_factory_exception_with_photos(uuid,text,timestamptz,text[]) from public,anon;
grant execute on function public.reply_to_factory_exception_with_photos(uuid,text,timestamptz,text[]) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects' and policyname='remove unattached factory reply photos'
  ) then
    create policy "remove unattached factory reply photos" on storage.objects
    for delete to authenticated using (
      bucket_id='exception-evidence'
      and owner_id=(select auth.uid()::text)
      and split_part(name,'/',2)='factory-reply'
      and not exists (
        select 1 from public.exception_tickets as ticket
        where ticket.id::text=split_part(storage.objects.name,'/',3)
          and storage.objects.name=any(ticket.evidence_paths)
      )
    );
  end if;
end $$;

notify pgrst,'reload schema';
commit;
