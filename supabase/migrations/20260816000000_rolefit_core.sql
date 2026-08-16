create schema if not exists app_private;
revoke all on schema app_private from public;

create function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  default_current_role text check (char_length(default_current_role) <= 80),
  default_target_role text check (char_length(default_target_role) <= 80),
  preferences jsonb not null default '{}'::jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_key text not null default 'free' check (plan_key in ('free', 'pro')),
  monthly_ai_units integer not null default 10 check (monthly_ai_units >= 0),
  period_started_at timestamptz not null default timezone('utc', now()),
  period_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '未命名简历' check (char_length(title) between 1 and 160),
  source_text text not null check (char_length(source_text) > 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.job_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null check (char_length(target_role) between 1 and 100),
  target_company text check (char_length(target_company) <= 160),
  target_industry text check (char_length(target_industry) <= 100),
  job_description text not null check (char_length(job_description) > 0),
  source_url text check (char_length(source_url) <= 2048),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.optimization_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete restrict,
  job_target_id uuid not null references public.job_targets(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  status text not null default 'diagnosed' check (status in ('diagnosed', 'refined', 'failed')),
  input_snapshot jsonb not null default '{}'::jsonb,
  diagnosis_result jsonb not null default '{}'::jsonb,
  refine_result jsonb,
  follow_up_answers jsonb not null default '{}'::jsonb,
  extras jsonb not null default '{}'::jsonb,
  is_pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  optimization_run_id uuid not null references public.optimization_runs(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 160),
  human_resume text not null default '',
  ats_resume text not null default '',
  summary text not null default '',
  match_score numeric(5, 2) check (match_score between 0 and 100),
  keywords_matched jsonb not null default '[]'::jsonb,
  keywords_missing jsonb not null default '[]'::jsonb,
  application_reason text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_target_id uuid not null references public.job_targets(id) on delete restrict,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  status text not null default 'wishlist'
    check (status in ('wishlist', 'applied', 'interview', 'offer', 'rejected')),
  applied_at date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_application_id uuid not null references public.job_applications(id) on delete cascade,
  event_type text not null check (
    event_type in ('created', 'status_changed', 'note', 'interview', 'offer', 'rejected', 'reminder')
  ),
  previous_status text check (
    previous_status is null or previous_status in ('wishlist', 'applied', 'interview', 'offer', 'rejected')
  ),
  next_status text check (
    next_status is null or next_status in ('wishlist', 'applied', 'interview', 'offer', 'rejected')
  ),
  occurred_at timestamptz not null default timezone('utc', now()),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  optimization_run_id uuid references public.optimization_runs(id) on delete set null,
  feature_key text not null check (
    feature_key in ('diagnose', 'refine', 'outreach', 'translate', 'portfolio')
  ),
  units integer not null default 1 check (units > 0),
  model text,
  status text not null check (status in ('started', 'succeeded', 'failed')),
  error_code text,
  created_at timestamptz not null default timezone('utc', now())
);

create index resumes_user_updated_idx on public.resumes (user_id, updated_at desc);
create index job_targets_user_updated_idx on public.job_targets (user_id, updated_at desc);
create index optimization_runs_user_created_idx on public.optimization_runs (user_id, created_at desc);
create index resume_versions_user_created_idx on public.resume_versions (user_id, created_at desc);
create index job_applications_user_status_idx on public.job_applications (user_id, status, updated_at desc);
create index application_events_application_occurred_idx
  on public.application_events (job_application_id, occurred_at desc);
create index ai_usage_events_user_created_idx on public.ai_usage_events (user_id, created_at desc);

create function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.user_entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure app_private.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

insert into public.user_entitlements (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure app_private.set_updated_at();
create trigger user_entitlements_set_updated_at
  before update on public.user_entitlements
  for each row execute procedure app_private.set_updated_at();
create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute procedure app_private.set_updated_at();
create trigger job_targets_set_updated_at
  before update on public.job_targets
  for each row execute procedure app_private.set_updated_at();
create trigger optimization_runs_set_updated_at
  before update on public.optimization_runs
  for each row execute procedure app_private.set_updated_at();
create trigger resume_versions_set_updated_at
  before update on public.resume_versions
  for each row execute procedure app_private.set_updated_at();
create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row execute procedure app_private.set_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.user_entitlements to authenticated;
grant select, insert, update, delete on public.resumes to authenticated;
grant select, insert, update, delete on public.job_targets to authenticated;
grant select, insert, update, delete on public.optimization_runs to authenticated;
grant select, insert, update, delete on public.resume_versions to authenticated;
grant select, insert, update, delete on public.job_applications to authenticated;
grant select, insert, update, delete on public.application_events to authenticated;
grant select, insert on public.ai_usage_events to authenticated;

alter table public.profiles enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.resumes enable row level security;
alter table public.job_targets enable row level security;
alter table public.optimization_runs enable row level security;
alter table public.resume_versions enable row level security;
alter table public.job_applications enable row level security;
alter table public.application_events enable row level security;
alter table public.ai_usage_events enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "entitlements_select_own" on public.user_entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "resumes_manage_own" on public.resumes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "job_targets_manage_own" on public.job_targets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "optimization_runs_manage_own" on public.optimization_runs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.resumes
      where resumes.id = resume_id
        and resumes.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.job_targets
      where job_targets.id = job_target_id
        and job_targets.user_id = (select auth.uid())
    )
  );

create policy "resume_versions_manage_own" on public.resume_versions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.optimization_runs
      where optimization_runs.id = optimization_run_id
        and optimization_runs.user_id = (select auth.uid())
    )
  );

create policy "job_applications_manage_own" on public.job_applications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.job_targets
      where job_targets.id = job_target_id
        and job_targets.user_id = (select auth.uid())
    )
    and (
      resume_version_id is null
      or exists (
        select 1 from public.resume_versions
        where resume_versions.id = resume_version_id
          and resume_versions.user_id = (select auth.uid())
      )
    )
  );

create policy "application_events_manage_own" on public.application_events
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.job_applications
      where job_applications.id = job_application_id
        and job_applications.user_id = (select auth.uid())
    )
  );

create policy "ai_usage_events_select_own" on public.ai_usage_events
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "ai_usage_events_insert_own" on public.ai_usage_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
