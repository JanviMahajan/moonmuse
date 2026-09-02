create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null,
  description text, is_active boolean not null default true, display_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.product_collections (
  product_id uuid not null references public.products on delete cascade,
  collection_id uuid not null references public.collections on delete cascade,
  created_at timestamptz not null default now(), primary key(product_id, collection_id)
);
create table if not exists public.product_personalisation_options (
  product_id uuid primary key references public.products on delete cascade,
  is_personalised boolean not null default false, customer_photo_required boolean not null default false,
  customer_instructions_required boolean not null default false, starting_price boolean not null default false,
  max_people integer check(max_people is null or max_people >= 0), max_pets integer check(max_pets is null or max_pets >= 0),
  photos_required integer check(photos_required is null or photos_required >= 0), available_sizes jsonb not null default '[]',
  available_variants jsonb not null default '[]', instructions text, updated_at timestamptz not null default now()
);
create table if not exists public.page_media_placements (
  id uuid primary key default gen_random_uuid(), placement text unique not null,
  storage_path text not null, alt_text text not null, is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.personalised_order_details (
  order_id uuid primary key references public.orders on delete cascade,
  occasion text, people_count integer, pets_count integer, names text, important_date date,
  short_message text, preferred_colours text, special_details text, customer_instructions text,
  requested_deadline date, selections jsonb not null default '{}', rejection_reason text,
  adjusted_price integer, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.personalised_order_files (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders on delete cascade,
  file_type text not null check(file_type in ('original','reference')), storage_path text not null,
  filename text not null, mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size bigint not null check(byte_size <= 10485760), display_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.collections enable row level security; alter table public.product_collections enable row level security;
alter table public.product_personalisation_options enable row level security; alter table public.page_media_placements enable row level security;
alter table public.personalised_order_details enable row level security; alter table public.personalised_order_files enable row level security;
create policy "public active collections" on public.collections for select using(is_active);
create policy "public product collections" on public.product_collections for select using(exists(select 1 from products p where p.id=product_id and p.is_active));
create policy "public personalisation options" on public.product_personalisation_options for select using(exists(select 1 from products p where p.id=product_id and p.is_active));
create policy "public page media" on public.page_media_placements for select using(is_active);
create policy "owner collections" on public.collections for all using(is_owner()) with check(is_owner());
create policy "owner product collections" on public.product_collections for all using(is_owner()) with check(is_owner());
create policy "owner personalisation options" on public.product_personalisation_options for all using(is_owner()) with check(is_owner());
create policy "owner page media" on public.page_media_placements for all using(is_owner()) with check(is_owner());
create policy "owner personalised orders" on public.personalised_order_details for all using(is_owner()) with check(is_owner());
create policy "owner personalised files" on public.personalised_order_files for all using(is_owner()) with check(is_owner());
insert into public.collections(slug,name,display_order) values
('personalised-gifts','Personalised Gifts',1),('featured-products','Featured Products',2),('new-arrivals','New Arrivals',3),
('couple-gifts','Couple Gifts',4),('family-gifts','Family Gifts',5),('pet-gifts','Pet Gifts',6),
('birthday-gifts','Birthday Gifts',7),('bestsellers','Bestsellers',8) on conflict(slug) do update set name=excluded.name,display_order=excluded.display_order;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('custom-orders','custom-orders',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
create policy "owner custom order storage" on storage.objects for all using(bucket_id='custom-orders' and is_owner()) with check(bucket_id='custom-orders' and is_owner());
