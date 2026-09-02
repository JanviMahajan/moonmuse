-- Backfill images uploaded through the legacy dashboard after product_media was introduced.
with missing as (
  select
    pi.*,
    row_number() over (
      partition by pi.product_id
      order by pi.display_order, pi.id
    ) as missing_order,
    coalesce((
      select max(pm.display_order)
      from public.product_media pm
      where pm.product_id = pi.product_id and pm.is_active
    ), -1) as current_max_order,
    exists(
      select 1 from public.product_media pm
      where pm.product_id = pi.product_id and pm.is_active and pm.is_primary
    ) as already_has_primary
  from public.product_images pi
  where pi.is_active
    and not exists (
      select 1 from public.product_media pm
      where pm.product_id = pi.product_id and pm.storage_path = pi.storage_path
    )
)
insert into public.product_media (
  product_id, media_type, storage_path, alt_text, display_order,
  is_primary, is_active, mime_type, created_at, updated_at
)
select
  product_id,
  'image',
  storage_path,
  alt_text,
  current_max_order + missing_order,
  not already_has_primary and missing_order = 1,
  true,
  case
    when lower(storage_path) like '%.png' then 'image/png'
    when lower(storage_path) like '%.webp' then 'image/webp'
    else 'image/jpeg'
  end,
  now(),
  now()
from missing;
