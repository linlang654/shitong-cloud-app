-- 配送员整单送达凭证：保存交付照片，并生成可随短信发送的公开图片链接。

alter table public.return_tasks
  add column if not exists delivery_photo_path text not null default '',
  add column if not exists delivered_at timestamptz;

comment on column public.return_tasks.delivery_photo_path is '整单送达照片在 return-delivery-proof 存储桶中的路径';
comment on column public.return_tasks.delivered_at is '配送员整单确认送达时间';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'return-delivery-proof',
  'return-delivery-proof',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "employees read return delivery proof" on storage.objects;
drop policy if exists "employees upload return delivery proof" on storage.objects;
drop policy if exists "employees delete return delivery proof" on storage.objects;

create policy "employees read return delivery proof" on storage.objects
for select using (
  bucket_id = 'return-delivery-proof'
  and auth.role() = 'authenticated'
);

create policy "employees upload return delivery proof" on storage.objects
for insert with check (
  bucket_id = 'return-delivery-proof'
  and auth.role() = 'authenticated'
);

create policy "employees delete return delivery proof" on storage.objects
for delete using (
  bucket_id = 'return-delivery-proof'
  and auth.role() = 'authenticated'
);

grant select, update on public.return_tasks to authenticated;
