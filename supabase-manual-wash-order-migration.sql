-- 后台登记已在抖音核销的订单。仅在业务库 bjlimqtrkdokmjpdcraa 执行本文件。

begin;

do $$
begin
  if to_regprocedure('public.issue_wash_label_barcodes(text[],uuid[],jsonb)') is null
    or to_regclass('public.wash_label_barcode_counters') is null then
    raise exception '请先在当前业务库执行水洗标首次编号迁移。';
  end if;
end;
$$;

-- 仅由录单函数写入。保留已登记团购码的摘要用于防重，避免在订单、员工页面和日志中暴露原码。
create table if not exists public.manual_wash_order_submissions (
  request_id uuid primary key,
  order_id uuid unique references public.orders(id) on delete set null,
  source text not null check (source in ('douyin', 'manual')),
  voucher_hash bytea,
  created_at timestamptz not null default now(),
  check ((source = 'douyin') = (voucher_hash is not null))
);

create unique index if not exists manual_wash_order_submissions_voucher_idx
on public.manual_wash_order_submissions(source, voucher_hash)
where voucher_hash is not null;

alter table public.manual_wash_order_submissions enable row level security;
revoke all on table public.manual_wash_order_submissions from public, anon, authenticated, service_role;

create or replace function public.create_manual_wash_order(order_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request_id uuid;
  v_submission_id uuid;
  v_order_id uuid;
  v_order_no text;
  v_voucher_code text;
  v_voucher_hash bytea;
  v_customer_name text;
  v_phone text;
  v_address text;
  v_school text;
  v_campus text;
  v_building text;
  v_exception_note text;
  v_merchant text;
  v_amount_text text;
  v_pickup_date_text text;
  v_pickup_date date;
  v_now timestamptz := statement_timestamp();
  v_local_now timestamp := v_now at time zone 'Asia/Shanghai';
  v_items jsonb;
  v_item jsonb;
  v_product_name text;
  v_spec text;
  v_count_text text;
  v_count integer;
  v_total integer := 0;
  v_item_index integer := 0;
  v_item_id uuid;
  v_prefix text;
begin
  if v_user_id is null or public.current_user_role() is distinct from 'admin' then
    raise exception using errcode = '42501', message = '只有管理员可以新增订单。';
  end if;

  if jsonb_typeof(order_data) is distinct from 'object' then
    raise exception using errcode = '22023', message = '订单资料格式不正确。';
  end if;

  if coalesce(order_data->>'request_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception using errcode = '22023', message = '录单请求编号无效，请重新打开录单表单。';
  end if;
  v_request_id := (order_data->>'request_id')::uuid;

  if (order_data->>'source') is distinct from 'douyin' then
    raise exception using errcode = '22023', message = '此入口仅用于登记抖音团购订单。';
  end if;
  if order_data->'redeemed' is distinct from 'true'::jsonb then
    raise exception using errcode = '22023', message = '请先在抖音完成核销，再确认已核销。';
  end if;
  v_voucher_code := upper(regexp_replace(normalize(coalesce(order_data->>'voucher_code', ''), NFKC), '[[:space:]]+', '', 'g'));
  if v_voucher_code !~ '^[A-Z0-9_-]{4,80}$' then
    raise exception using errcode = '22023', message = '请输入有效的抖音团购码（4 至 80 位数字、字母、短横线或下划线）。';
  end if;
  v_voucher_hash := sha256(convert_to(v_voucher_code, 'UTF8'));

  v_customer_name := btrim(coalesce(order_data->>'customer_name', ''));
  v_phone := btrim(coalesce(order_data->>'phone', ''));
  v_address := btrim(coalesce(order_data->>'address', ''));
  v_school := coalesce(nullif(btrim(order_data->>'school'), ''), '学校未识别');
  v_campus := coalesce(nullif(btrim(order_data->>'campus'), ''), '校区未识别');
  v_building := coalesce(nullif(btrim(order_data->>'building'), ''), '楼栋未识别');
  v_exception_note := btrim(coalesce(order_data->>'exception_note', ''));
  v_merchant := coalesce(nullif(btrim(order_data->>'merchant'), ''), '事事超级洗护馆');
  v_amount_text := btrim(coalesce(order_data->>'paid_amount', ''));

  if char_length(v_customer_name) not between 1 and 80 or char_length(v_address) not between 1 and 500 then
    raise exception using errcode = '22023', message = '请填写姓名（最多 80 字）和完整地址（最多 500 字）。';
  end if;
  if v_phone !~ '^1[3-9][0-9]{9}$' then
    raise exception using errcode = '22023', message = '请输入有效的 11 位手机号。';
  end if;
  if greatest(char_length(v_school), char_length(v_campus), char_length(v_building), char_length(v_merchant)) > 80
      or char_length(v_exception_note) > 500 then
    raise exception using errcode = '22023', message = '学校、校区、楼栋、商家最多 80 字，地址备注最多 500 字。';
  end if;
  if v_amount_text !~ '^[0-9]{1,6}(\.[0-9]{1,2})?$' then
    raise exception using errcode = '22023', message = '请填写实际支付金额（0 至 999999.99 元，最多两位小数）。';
  end if;

  v_pickup_date_text := btrim(coalesce(order_data->>'pickup_date', ''));
  if v_pickup_date_text = '' then
    v_pickup_date := v_local_now::date + case when v_local_now::time >= time '18:00' then 1 else 0 end;
  else
    if v_pickup_date_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception using errcode = '22023', message = '取件日期格式不正确。';
    end if;
    begin
      v_pickup_date := v_pickup_date_text::date;
    exception when datetime_field_overflow or invalid_datetime_format then
      raise exception using errcode = '22023', message = '取件日期无效。';
    end;
  end if;

  v_items := order_data->'items';
  if jsonb_typeof(v_items) is distinct from 'array' then
    raise exception using errcode = '22023', message = '请添加至少一项洗护商品。';
  end if;
  if jsonb_array_length(v_items) not between 1 and 100 then
    raise exception using errcode = '22023', message = '一单最多录入 100 项洗护商品。';
  end if;
  for v_item in select value from jsonb_array_elements(v_items) loop
    v_product_name := btrim(coalesce(v_item->>'product_name', ''));
    v_spec := btrim(coalesce(v_item->>'spec', ''));
    v_count_text := btrim(coalesce(v_item->>'count', ''));
    if jsonb_typeof(v_item) is distinct from 'object' or char_length(v_product_name) not between 1 and 120
        or char_length(v_spec) > 120 or v_count_text !~ '^([1-9][0-9]?|100)$' then
      raise exception using errcode = '22023', message = '每项需填写商品名称、规格（最多 120 字）及 1 至 100 个水洗标。';
    end if;
    v_total := v_total + v_count_text::integer;
    if v_total > 100 then
      raise exception using errcode = '22023', message = '一单最多生成 100 个水洗标。';
    end if;
  end loop;

  -- 唯一约束同时处理网络重试、重复录入和多个后台并发录入同一团购码。
  insert into public.manual_wash_order_submissions (request_id, source, voucher_hash)
  values (v_request_id, 'douyin', v_voucher_hash)
  on conflict do nothing
  returning request_id into v_submission_id;

  if v_submission_id is null then
    select submission.order_id into v_order_id
    from public.manual_wash_order_submissions submission
    where submission.request_id = v_request_id
       or (submission.source = 'douyin' and submission.voucher_hash = v_voucher_hash)
    order by (submission.request_id = v_request_id) desc
    limit 1;

    if v_order_id is null then
      raise exception using errcode = '23505', message = '这笔订单已经登记过，但原订单已删除，请核对后处理。';
    end if;

    select existing_order.order_no, task.pickup_date,
      (select count(*) from public.order_items item where item.order_id = existing_order.id)
    into v_order_no, v_pickup_date, v_total
    from public.orders existing_order
    left join public.pickup_tasks task on task.order_id = existing_order.id
    where existing_order.id = v_order_id;

    if not found then
      raise exception using errcode = '23505', message = '这笔订单已经登记过，但原订单已删除，请核对后处理。';
    end if;

    return jsonb_build_object('order_id', v_order_id, 'order_no', v_order_no, 'item_count', v_total,
      'pickup_date', v_pickup_date, 'already_exists', true);
  end if;

  v_order_no := 'DY-' || to_char(v_local_now, 'YYMMDD') || '-' || upper(replace(v_request_id::text, '-', ''));

  insert into public.orders (
    order_no, business_type, source, merchant, customer_name, phone, address, school, campus,
    building, paid_amount, order_time, order_status, exception_note, updated_at
  ) values (
    v_order_no, 'wash_care', 'douyin', v_merchant, v_customer_name, v_phone, v_address, v_school, v_campus,
    v_building, v_amount_text::numeric, v_now, '待取件', v_exception_note, v_now
  ) returning id into v_order_id;

  insert into public.pickup_tasks (order_id, pickup_date, status, updated_at)
  values (v_order_id, v_pickup_date, '待取件', v_now);

  v_prefix := to_char(v_pickup_date, 'YYMMDD');
  for v_item in select value from jsonb_array_elements(v_items) loop
    v_product_name := btrim(v_item->>'product_name');
    v_spec := btrim(coalesce(v_item->>'spec', ''));
    v_count := (v_item->>'count')::integer;
    for i in 1..v_count loop
      v_item_index := v_item_index + 1;
      v_item_id := gen_random_uuid();

      -- 首次导出时由水洗标编号函数按楼栋统一分配正式条码。
      insert into public.order_items (id, order_id, barcode, source_key, product_name, spec, item_index, item_status, updated_at)
      values (v_item_id, v_order_id, 'pending:' || v_prefix || ':' || v_item_id::text,
        'manual-wash:' || v_request_id::text || ':' || v_item_index::text,
        v_product_name, v_spec, v_item_index, '待取件', v_now);

      insert into public.status_logs (order_id, item_id, barcode, status, note, operator_id)
      values (v_order_id, v_item_id, null, '待取件', '后台登记抖音已核销团购订单', v_user_id);
    end loop;
  end loop;

  update public.manual_wash_order_submissions set order_id = v_order_id where request_id = v_request_id;

  return jsonb_build_object('order_id', v_order_id, 'order_no', v_order_no, 'item_count', v_total,
    'pickup_date', v_pickup_date, 'already_exists', false);
end;
$$;

revoke all on function public.create_manual_wash_order(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.create_manual_wash_order(jsonb) to authenticated;

commit;
