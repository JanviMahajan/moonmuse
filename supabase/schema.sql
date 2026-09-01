-- MoonMuse database, storage and RLS. Run in the Supabase SQL editor.
create extension if not exists pgcrypto;
create table profiles (id uuid primary key references auth.users on delete cascade, full_name text, role text not null default 'customer' check(role in ('customer','owner')), created_at timestamptz default now());
create table products (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text, is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table product_sizes (id uuid primary key default gen_random_uuid(), product_id uuid references products on delete cascade, name text not null, dimensions text, price_inr integer not null check(price_inr>=0), display_order int default 0, is_active boolean default true);
create table media_assets (id uuid primary key default gen_random_uuid(), storage_path text not null, public_or_private text not null check(public_or_private in ('public','private')), section text not null, title text, alt_text text, display_order int default 0, is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table site_content (id uuid primary key default gen_random_uuid(), content_key text unique not null, value jsonb not null default '{}', updated_at timestamptz default now());
create table gallery_items (id uuid primary key default gen_random_uuid(), media_id uuid references media_assets, category text not null, title text not null, story text, display_order int default 0, is_active boolean default true);
create table design_templates (id uuid primary key default gen_random_uuid(), name text not null, product_id uuid references products, thumbnail_id uuid references media_assets, canvas_json jsonb not null default '{}', is_active boolean default true);
create table sticker_assets (id uuid primary key default gen_random_uuid(), name text not null, media_id uuid references media_assets, category text, is_active boolean default true);
create table orders (id uuid primary key default gen_random_uuid(), order_number text unique not null, full_name text not null, email text not null, whatsapp text not null, city text not null, pin_code text not null, note text, status text not null default 'New Request', delivery_charge integer, payment_status text default 'Pending', tracking_number text, internal_notes text, handmade_accepted boolean not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table order_items (id uuid primary key default gen_random_uuid(), order_id uuid references orders on delete cascade, product_id uuid references products, size_id uuid references product_sizes, creation_mode text not null, unit_price integer not null, design_fee integer default 0, quantity int default 1);
create table customer_designs (id uuid primary key default gen_random_uuid(), order_item_id uuid references order_items on delete cascade, canvas_json jsonb, preview_storage_path text, source_files jsonb default '[]', created_at timestamptz default now());
create table order_status_history (id uuid primary key default gen_random_uuid(), order_id uuid references orders on delete cascade, status text not null, customer_message text, created_at timestamptz default now());
create table product_variants (id uuid primary key default gen_random_uuid(), product_id uuid references products on delete cascade, slug text not null, name text not null, price_inr integer not null default 0, metadata jsonb not null default '{}', is_active boolean default true, unique(product_id,slug));
create table frame_colours (id uuid primary key default gen_random_uuid(), name text unique not null, hex_colour text not null, is_active boolean default true, display_order int default 0);
create table wallpaper_presets (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, width int not null, height int not null, is_active boolean default true);
create table canvas_designs (id uuid primary key default gen_random_uuid(), owner_id uuid references auth.users, product_id uuid references products, variant_id uuid references product_variants, frame_colour_id uuid references frame_colours, canvas_width int not null, canvas_height int not null, background jsonb default '{}', template_id uuid references design_templates, created_at timestamptz default now(), updated_at timestamptz default now());
create table canvas_elements (id uuid primary key default gen_random_uuid(), design_id uuid references canvas_designs on delete cascade, element_type text not null, layer_order int not null, properties jsonb not null default '{}', is_visible boolean default true, is_locked boolean default false);
create table uploaded_assets (id uuid primary key default gen_random_uuid(), design_id uuid references canvas_designs on delete cascade, storage_path text not null, mime_type text not null, byte_size bigint not null check(byte_size <= 10485760), created_at timestamptz default now());
create table drawings (id uuid primary key default gen_random_uuid(), design_id uuid references canvas_designs on delete cascade, layer_order int not null, path_data jsonb not null, brush jsonb not null default '{}');
create table preview_exports (id uuid primary key default gen_random_uuid(), design_id uuid references canvas_designs on delete cascade, storage_path text not null, width int not null, height int not null, created_at timestamptz default now());
alter table profiles enable row level security; alter table products enable row level security; alter table product_sizes enable row level security; alter table media_assets enable row level security; alter table site_content enable row level security; alter table gallery_items enable row level security; alter table design_templates enable row level security; alter table sticker_assets enable row level security; alter table orders enable row level security; alter table order_items enable row level security; alter table customer_designs enable row level security; alter table order_status_history enable row level security;
alter table product_variants enable row level security; alter table frame_colours enable row level security; alter table wallpaper_presets enable row level security; alter table canvas_designs enable row level security; alter table canvas_elements enable row level security; alter table uploaded_assets enable row level security; alter table drawings enable row level security; alter table preview_exports enable row level security;
create function is_owner() returns boolean language sql security definer set search_path=public stable as $$ select exists(select 1 from profiles where id=auth.uid() and role='owner') $$;
create policy "public products" on products for select using(is_active); create policy "public sizes" on product_sizes for select using(is_active); create policy "public media" on media_assets for select using(public_or_private='public' and is_active); create policy "public content" on site_content for select using(true); create policy "public gallery" on gallery_items for select using(is_active); create policy "public templates" on design_templates for select using(is_active); create policy "public stickers" on sticker_assets for select using(is_active);
create policy "owner profiles" on profiles for all using(is_owner()) with check(is_owner()); create policy "owner products" on products for all using(is_owner()) with check(is_owner()); create policy "owner sizes" on product_sizes for all using(is_owner()) with check(is_owner()); create policy "owner media" on media_assets for all using(is_owner()) with check(is_owner()); create policy "owner content" on site_content for all using(is_owner()) with check(is_owner()); create policy "owner gallery" on gallery_items for all using(is_owner()) with check(is_owner()); create policy "owner templates" on design_templates for all using(is_owner()) with check(is_owner()); create policy "owner stickers" on sticker_assets for all using(is_owner()) with check(is_owner()); create policy "owner orders" on orders for all using(is_owner()) with check(is_owner()); create policy "owner items" on order_items for all using(is_owner()) with check(is_owner()); create policy "owner designs" on customer_designs for all using(is_owner()) with check(is_owner()); create policy "owner history" on order_status_history for all using(is_owner()) with check(is_owner());
create policy "public variants" on product_variants for select using(is_active); create policy "public frame colours" on frame_colours for select using(is_active); create policy "public wallpaper presets" on wallpaper_presets for select using(is_active);
create policy "owner variants" on product_variants for all using(is_owner()) with check(is_owner()); create policy "owner frame colours" on frame_colours for all using(is_owner()) with check(is_owner()); create policy "owner wallpaper presets" on wallpaper_presets for all using(is_owner()) with check(is_owner()); create policy "owner canvas designs" on canvas_designs for all using(is_owner()) with check(is_owner()); create policy "owner canvas elements" on canvas_elements for all using(is_owner()) with check(is_owner()); create policy "owner uploaded assets" on uploaded_assets for all using(is_owner()) with check(is_owner()); create policy "owner drawings" on drawings for all using(is_owner()) with check(is_owner()); create policy "owner preview exports" on preview_exports for all using(is_owner()) with check(is_owner());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('site','site',true,10485760,array['image/jpeg','image/png','image/webp']),('products','products',true,10485760,array['image/jpeg','image/png','image/webp']),('gallery','gallery',true,10485760,array['image/jpeg','image/png','image/webp']),('templates','templates',true,10485760,array['image/jpeg','image/png','image/webp']),('stickers','stickers',true,10485760,array['image/png','image/webp']),('orders','orders',false,10485760,array['image/jpeg','image/png','image/webp']) on conflict do nothing;
create policy "owner storage manage" on storage.objects for all using(is_owner()) with check(is_owner()); create policy "public assets read" on storage.objects for select using(bucket_id in ('site','products','gallery','templates','stickers'));

insert into products(slug,name,description) values ('frame','Memory Frames','Personalised handmade memory frames'),('tote','Painted Tote','Hand-painted cream canvas tote'),('wallpaper','Digital Wallpapers','Free custom digital wallpaper') on conflict(slug) do update set name=excluded.name;
insert into product_sizes(product_id,name,dimensions,price_inr,display_order) select id,'Small Frame','5 × 7 inches',350,1 from products where slug='frame' on conflict do nothing;
insert into product_sizes(product_id,name,dimensions,price_inr,display_order) select id,'Medium Frame','9 × 12 inches (A4)',550,2 from products where slug='frame' on conflict do nothing;
insert into product_variants(product_id,slug,name,price_inr,metadata) select id,'one-size','One Size',499,'{"shipping":true}' from products where slug='tote' on conflict(product_id,slug) do update set price_inr=499;
insert into product_variants(product_id,slug,name,price_inr,metadata) select id,'free','Free Download',0,'{"shipping":false}' from products where slug='wallpaper' on conflict(product_id,slug) do update set price_inr=0;
insert into frame_colours(name,hex_colour,display_order) values ('Black','#171417',1),('White','#fffdf8',2) on conflict(name) do update set hex_colour=excluded.hex_colour;
insert into wallpaper_presets(slug,name,width,height) values ('mobile','Mobile',1080,1920),('desktop','Laptop/Desktop',1920,1080),('tablet','Tablet',1536,2048) on conflict(slug) do update set width=excluded.width,height=excluded.height;

-- Human-designed "Design It for Me" workflow.
create table if not exists design_requests (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  full_name text not null,
  email text not null,
  whatsapp text not null,
  product text not null check (product in ('frame','tote','wallpaper')),
  product_size text,
  frame_colour text,
  wallpaper_device text,
  price_inr integer not null default 0,
  occasion text,
  recipient_name text,
  important_date date,
  personal_message text,
  preferred_colours text,
  style_preference text,
  instructions text not null,
  status text not null default 'New Request',
  payment_status text not null default 'Pending',
  shipping_charge integer,
  shipping_status text not null default 'Not required',
  courier_name text,
  tracking_number text,
  internal_notes text,
  preview_token_hash text unique,
  preview_sent_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists design_request_assets (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references design_requests on delete cascade,
  asset_type text not null check (asset_type in ('photo','reference')),
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size <= 10485760),
  created_at timestamptz not null default now()
);
create table if not exists design_previews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references design_requests on delete cascade,
  version integer not null,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  owner_message text,
  is_current boolean not null default true,
  is_archived boolean not null default false,
  sent_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(request_id, version)
);
create table if not exists design_request_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references design_requests on delete cascade,
  status text not null,
  customer_message text,
  created_at timestamptz not null default now()
);
create index if not exists design_requests_lookup on design_requests(order_number, status, product, created_at desc);
create index if not exists design_request_assets_request on design_request_assets(request_id);
create index if not exists design_previews_request on design_previews(request_id, version desc);
alter table design_requests enable row level security;
alter table design_request_assets enable row level security;
alter table design_previews enable row level security;
alter table design_request_history enable row level security;
create policy "owner design requests" on design_requests for all using(is_owner()) with check(is_owner());
create policy "owner request assets" on design_request_assets for all using(is_owner()) with check(is_owner());
create policy "owner design previews" on design_previews for all using(is_owner()) with check(is_owner());
create policy "owner request history" on design_request_history for all using(is_owner()) with check(is_owner());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('design-requests','design-requests',false,10485760,array['image/jpeg','image/png','image/webp']),
  ('order-previews','order-previews',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false;

-- Commerce catalogue, carts, protected template versions, chat and notifications.
create table if not exists categories (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  name text not null, display_order int not null default 0,
  image_path text, is_active boolean not null default true, created_at timestamptz default now()
);
alter table products add column if not exists category_id uuid references categories;
alter table products add column if not exists price_inr integer not null default 0;
alter table products add column if not exists sale_price_inr integer;
alter table products add column if not exists availability text not null default 'In Stock';
alter table products add column if not exists product_story text;
alter table products add column if not exists materials text;
alter table products add column if not exists dimensions text;
alter table products add column if not exists care_instructions text;
alter table products add column if not exists processing_time text;
alter table products add column if not exists is_featured boolean not null default false;
create table if not exists product_images (id uuid primary key default gen_random_uuid(), product_id uuid not null references products on delete cascade, storage_path text not null, alt_text text, display_order int default 0, is_active boolean default true);
create table if not exists inventory (product_id uuid primary key references products on delete cascade, quantity int, reserved_quantity int not null default 0, updated_at timestamptz default now(), check(quantity is null or quantity >= 0), check(reserved_quantity >= 0));
create table if not exists frame_templates (id uuid primary key default gen_random_uuid(), product_id uuid unique not null references products on delete cascade, current_version int not null default 1, status text not null default 'draft', occasion text, required_photo_count int not null default 0, available_sizes jsonb not null default '[]', available_colours jsonb not null default '[]', display_order int default 0, archived_at timestamptz);
create table if not exists frame_template_versions (id uuid primary key default gen_random_uuid(), template_id uuid not null references frame_templates on delete cascade, version int not null, base_design_path text not null, thumbnail_path text, canvas_width int not null, canvas_height int not null, published_at timestamptz, created_at timestamptz default now(), unique(template_id,version));
create table if not exists template_photo_slots (id uuid primary key default gen_random_uuid(), version_id uuid not null references frame_template_versions on delete cascade, slot_name text not null, x numeric not null, y numeric not null, width numeric not null, height numeric not null, shape text not null default 'rectangle', crop jsonb default '{}', rotation numeric default 0, border_radius numeric default 0, placeholder_path text, is_required boolean default true, layer_position int default 0, mask_path text);
create table if not exists template_text_fields (id uuid primary key default gen_random_uuid(), version_id uuid not null references frame_template_versions on delete cascade, field_key text not null, label text not null, placeholder text, default_text text, x numeric not null, y numeric not null, width numeric not null, height numeric not null, max_length int, font_family text, font_size numeric, font_colour text, text_align text default 'center', line_limit int default 1, is_required boolean default false, allow_colour boolean default false, allow_font boolean default false, unique(version_id,field_key));
create table if not exists customers (id uuid primary key default gen_random_uuid(), email text, whatsapp text, full_name text not null, access_token_hash text, created_at timestamptz default now());
create table if not exists carts (id uuid primary key default gen_random_uuid(), customer_id uuid references customers, access_token_hash text not null, expires_at timestamptz not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists cart_items (id uuid primary key default gen_random_uuid(), cart_id uuid not null references carts on delete cascade, product_id uuid not null references products, design_id uuid references customer_designs, quantity int not null default 1 check(quantity>0), selected_options jsonb default '{}', created_at timestamptz default now());
alter table orders add column if not exists customer_id uuid references customers;
alter table orders add column if not exists address text;
alter table orders add column if not exists state text;
alter table orders add column if not exists subtotal integer not null default 0;
alter table orders add column if not exists final_total integer;
alter table orders add column if not exists payment_method text;
alter table orders add column if not exists payment_reference text;
alter table orders add column if not exists access_token_hash text unique;
create table if not exists customer_design_values (id uuid primary key default gen_random_uuid(), design_id uuid not null references customer_designs on delete cascade, field_id uuid references template_text_fields, value text, unique(design_id,field_id));
create table if not exists customer_design_files (id uuid primary key default gen_random_uuid(), design_id uuid not null references customer_designs on delete cascade, slot_id uuid references template_photo_slots, storage_path text not null, filename text not null, mime_type text not null, byte_size bigint not null check(byte_size<=10485760), transform jsonb default '{}', created_at timestamptz default now());
create table if not exists conversations (id uuid primary key default gen_random_uuid(), customer_id uuid references customers, product_id uuid references products, order_id uuid references orders, access_token_hash text not null unique, status text not null default 'open', owner_note text, unread_count int not null default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists conversation_participants (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations on delete cascade, profile_id uuid references profiles, customer_id uuid references customers, last_read_at timestamptz, unique(conversation_id,profile_id,customer_id));
create table if not exists messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations on delete cascade, sender_type text not null check(sender_type in ('customer','owner')), body text not null, delivered_at timestamptz, read_at timestamptz, created_at timestamptz default now());
create table if not exists message_attachments (id uuid primary key default gen_random_uuid(), message_id uuid not null references messages on delete cascade, storage_path text not null, filename text not null, mime_type text not null, byte_size bigint not null check(byte_size<=10485760), created_at timestamptz default now());
create table if not exists notifications (id uuid primary key default gen_random_uuid(), owner_id uuid references profiles, kind text not null, title text not null, body text, related_type text, related_id uuid, is_read boolean not null default false, created_at timestamptz default now());
create index if not exists products_category_active on products(category_id,is_active,created_at desc);
create index if not exists template_versions_lookup on frame_template_versions(template_id,version desc);
create index if not exists orders_customer_created on orders(customer_id,created_at desc);
create index if not exists conversations_updated on conversations(updated_at desc);
create index if not exists messages_conversation_created on messages(conversation_id,created_at);
alter table categories enable row level security; alter table product_images enable row level security; alter table inventory enable row level security; alter table frame_templates enable row level security; alter table frame_template_versions enable row level security; alter table template_photo_slots enable row level security; alter table template_text_fields enable row level security; alter table customers enable row level security; alter table carts enable row level security; alter table cart_items enable row level security; alter table customer_design_values enable row level security; alter table customer_design_files enable row level security; alter table conversations enable row level security; alter table conversation_participants enable row level security; alter table messages enable row level security; alter table message_attachments enable row level security; alter table notifications enable row level security;
create policy "public active categories" on categories for select using(is_active);
create policy "public active product images" on product_images for select using(is_active and exists(select 1 from products p where p.id=product_id and p.is_active));
create policy "public published templates" on frame_templates for select using(status='published');
create policy "public published template versions" on frame_template_versions for select using(published_at is not null and exists(select 1 from frame_templates t where t.id=template_id and t.status='published'));
create policy "public published photo slots" on template_photo_slots for select using(exists(select 1 from frame_template_versions v join frame_templates t on t.id=v.template_id where v.id=version_id and v.published_at is not null and t.status='published'));
create policy "public published text fields" on template_text_fields for select using(exists(select 1 from frame_template_versions v join frame_templates t on t.id=v.template_id where v.id=version_id and v.published_at is not null and t.status='published'));
create policy "owner categories" on categories for all using(is_owner()) with check(is_owner()); create policy "owner product images" on product_images for all using(is_owner()) with check(is_owner()); create policy "owner inventory" on inventory for all using(is_owner()) with check(is_owner()); create policy "owner frame templates" on frame_templates for all using(is_owner()) with check(is_owner()); create policy "owner template versions" on frame_template_versions for all using(is_owner()) with check(is_owner()); create policy "owner photo slots" on template_photo_slots for all using(is_owner()) with check(is_owner()); create policy "owner text fields" on template_text_fields for all using(is_owner()) with check(is_owner()); create policy "owner customers" on customers for all using(is_owner()) with check(is_owner()); create policy "owner carts" on carts for all using(is_owner()) with check(is_owner()); create policy "owner cart items" on cart_items for all using(is_owner()) with check(is_owner()); create policy "owner design values" on customer_design_values for all using(is_owner()) with check(is_owner()); create policy "owner design files" on customer_design_files for all using(is_owner()) with check(is_owner()); create policy "owner conversations" on conversations for all using(is_owner()) with check(is_owner()); create policy "owner participants" on conversation_participants for all using(is_owner()) with check(is_owner()); create policy "owner messages" on messages for all using(is_owner()) with check(is_owner()); create policy "owner message attachments" on message_attachments for all using(is_owner()) with check(is_owner()); create policy "owner notifications" on notifications for all using(is_owner()) with check(is_owner());
insert into categories(slug,name,display_order) values ('ashtrays','Ashtrays',1),('totes','Tote Bags',2),('keychains','Keychains',3),('paintings','Paintings',4),('frames','Frames',5),('frame-templates','Frame Templates',6) on conflict(slug) do update set name=excluded.name,display_order=excluded.display_order;
