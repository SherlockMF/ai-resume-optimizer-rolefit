-- Waffo Pancake billing: webhook idempotency + entitlement payment fields.

alter table public.user_entitlements
  add column if not exists waffo_order_id text,
  add column if not exists waffo_status text;

create table if not exists public.waffo_webhook_events (
  id text primary key,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default timezone('utc', now())
);

alter table public.waffo_webhook_events enable row level security;

grant select, insert, update, delete on public.waffo_webhook_events to service_role;
grant update on public.user_entitlements to service_role;
