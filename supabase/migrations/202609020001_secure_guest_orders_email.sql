-- Secure guest checkout, tracking and email delivery records.
-- Apply after supabase/schema.sql.

alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists state text;
alter table public.orders add column if not exists subtotal integer not null default 0;
alter table public.orders add column if not exists final_total integer;
alter table public.orders add column if not exists access_token_hash text unique;
alter table public.orders add column if not exists idempotency_key text unique;
alter table public.orders add column if not exists latest_update text;

alter table public.order_items add column if not exists product_name text;
alter table public.order_items add column if not exists selected_options jsonb not null default '{}';
alter table public.order_items add column if not exists preview_path text;

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders on delete cascade,
  email_type text not null check (email_type in (
    'Owner order notification', 'Customer order confirmation',
    'Order-status update', 'Chat-reply notification', 'Test email'
  )),
  recipient text not null,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'Queued' check (status in ('Queued','Sending','Sent','Delivered','Failed','Bounced','Complained')),
  attempt_count integer not null default 0,
  last_error_code text,
  last_error_message_safe text,
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  body text,
  related_order_id uuid references public.orders on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.endpoint_rate_limits (
  identifier_hash text not null,
  action text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  primary key (identifier_hash, action, window_started_at)
);

create index if not exists email_deliveries_order_created on public.email_deliveries(order_id, created_at desc);
create index if not exists admin_notifications_unread on public.admin_notifications(is_read, created_at desc);

alter table public.email_deliveries enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.endpoint_rate_limits enable row level security;

drop policy if exists "owner email deliveries" on public.email_deliveries;
create policy "owner email deliveries" on public.email_deliveries
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "owner admin notifications" on public.admin_notifications;
create policy "owner admin notifications" on public.admin_notifications
  for all using (public.is_owner()) with check (public.is_owner());

-- Sensitive order tables remain unavailable to anonymous browser clients.
-- Guest creation/tracking is performed only by service-role Edge Functions.
revoke all on public.orders, public.order_items, public.email_deliveries, public.admin_notifications from anon;
revoke all on public.endpoint_rate_limits from anon, authenticated;
