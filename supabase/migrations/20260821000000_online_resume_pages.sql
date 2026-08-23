-- Online resume pages (RoleFit 2.0)
-- Run in Supabase SQL Editor after core migration.

create table if not exists public.online_resume_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text unique
    check (
      slug is null
      or (
        char_length(slug) between 3 and 48
        and slug ~ '^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?$'
      )
    ),
  title text not null default '未命名主页'
    check (char_length(title) between 1 and 160),
  theme_id text not null default 'clean'
    check (theme_id in ('clean', 'product', 'creative', 'tech')),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  content jsonb not null default '{}'::jsonb,
  source_type text not null default 'manual'
    check (source_type in ('pdf', 'history', 'version', 'manual')),
  source_history_id uuid,
  source_version_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint online_resume_pages_published_needs_slug check (
    status <> 'published' or slug is not null
  )
);

create index if not exists online_resume_pages_user_updated_idx
  on public.online_resume_pages (user_id, updated_at desc);

create index if not exists online_resume_pages_published_slug_idx
  on public.online_resume_pages (slug)
  where status = 'published';

drop trigger if exists online_resume_pages_set_updated_at on public.online_resume_pages;
create trigger online_resume_pages_set_updated_at
  before update on public.online_resume_pages
  for each row execute function app_private.set_updated_at();

grant select, insert, update, delete on public.online_resume_pages to authenticated;
grant select on public.online_resume_pages to anon;
grant select, insert, update, delete on public.online_resume_pages to service_role;

alter table public.online_resume_pages enable row level security;

drop policy if exists "online_resume_pages_manage_own" on public.online_resume_pages;
create policy "online_resume_pages_manage_own" on public.online_resume_pages
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "online_resume_pages_public_read" on public.online_resume_pages;
create policy "online_resume_pages_public_read" on public.online_resume_pages
  for select to anon, authenticated
  using (status = 'published');

-- Extend AI usage feature_key check to include online_resume
alter table public.ai_usage_events
  drop constraint if exists ai_usage_events_feature_key_check;

alter table public.ai_usage_events
  add constraint ai_usage_events_feature_key_check
  check (
    feature_key in (
      'diagnose',
      'refine',
      'outreach',
      'translate',
      'portfolio',
      'online_resume'
    )
  );
