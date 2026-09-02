-- Ordered product image/video gallery. Apply after the commerce catalogue schema.
create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  media_type text not null check (media_type in ('image','video','external_video')),
  storage_path text,
  external_url text,
  thumbnail_path text,
  poster_path text,
  alt_text text,
  caption text,
  display_order integer not null default 0 check (display_order >= 0),
  is_primary boolean not null default false,
  is_active boolean not null default true,
  mime_type text,
  file_size bigint,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (media_type = 'external_video' and external_url is not null and storage_path is null)
    or (media_type in ('image','video') and storage_path is not null)
  ),
  check (
    file_size is null
    or (media_type = 'image' and file_size <= 10485760)
    or (media_type = 'video' and file_size <= 52428800)
    or media_type = 'external_video'
  )
);

create unique index if not exists product_media_one_primary
  on public.product_media(product_id) where is_primary and is_active;
create index if not exists product_media_order
  on public.product_media(product_id, display_order) where is_active;
create index if not exists product_media_public_lookup
  on public.product_media(product_id, is_active, display_order);

alter table public.product_media enable row level security;
drop policy if exists "public active product media" on public.product_media;
create policy "public active product media" on public.product_media for select
  using (is_active and exists(select 1 from public.products p where p.id=product_id and p.is_active));
drop policy if exists "owner product media" on public.product_media;
create policy "owner product media" on public.product_media for all
  using (public.is_owner()) with check (public.is_owner());

create or replace function public.ensure_product_media_primary_after_delete()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.is_primary then
    update public.product_media
    set is_primary = true, updated_at = now()
    where id = (
      select id from public.product_media
      where product_id = old.product_id and is_active and media_type = 'image'
      order by display_order, created_at limit 1
    );
  end if;
  return old;
end $$;
drop trigger if exists product_media_primary_after_delete on public.product_media;
create trigger product_media_primary_after_delete
after delete on public.product_media for each row
execute function public.ensure_product_media_primary_after_delete();

-- Preserve all existing image records. The lowest display order becomes primary.
insert into public.product_media (
  product_id, media_type, storage_path, alt_text, display_order, is_primary,
  is_active, mime_type, created_at, updated_at
)
select
  pi.product_id, 'image', pi.storage_path, pi.alt_text,
  row_number() over (partition by pi.product_id order by pi.is_active desc, pi.display_order, pi.id) - 1,
  row_number() over (partition by pi.product_id order by pi.is_active desc, pi.display_order, pi.id) = 1,
  pi.is_active,
  case
    when lower(pi.storage_path) like '%.png' then 'image/png'
    when lower(pi.storage_path) like '%.webp' then 'image/webp'
    else 'image/jpeg'
  end,
  now(), now()
from public.product_images pi
where not exists (
  select 1 from public.product_media pm
  where pm.product_id = pi.product_id and pm.storage_path = pi.storage_path
);

-- The products bucket now accepts direct product videos up to 50 MB.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
where id = 'products';
