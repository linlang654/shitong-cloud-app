-- 为每次工厂“确认整批入库/出库”保留独立批次标识。
-- 历史扫码记录保持为空，前端会按相邻扫码时间归入历史批次，不影响现有数据。
alter table public.factory_scans
  add column if not exists batch_key uuid;

create index if not exists factory_scans_batch_key_created_at_idx
  on public.factory_scans (batch_key, created_at);
