create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  campaign_id uuid references public.campaigns(id) on delete set null,
  youtube_channel_url text,
  youtube_channel_id text not null unique,
  instagram_handle text,
  tiktok_handle text,
  rate_per_short numeric(10, 2) not null default 0,
  active boolean not null default true,
  payment_notes text,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  youtube_video_id text not null unique,
  title text not null,
  youtube_url text not null,
  published_at timestamptz not null,
  duration_seconds integer not null default 0,
  is_short boolean not null default false,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  comment_count bigint not null default 0,
  last_synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'payment_status'
  ) then
    create type public.payment_status as enum ('unpaid', 'paid');
  end if;
end
$$;

create table if not exists public.weekly_payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  week_start_date date not null,
  week_end_date date not null,
  shorts_count integer not null default 0,
  total_views bigint not null default 0,
  rate_per_short numeric(10, 2) not null default 0,
  total_owed numeric(10, 2) not null default 0,
  status public.payment_status not null default 'unpaid',
  paid_date date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (creator_id, week_start_date)
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null default 'daily_sync',
  status text not null,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  creators_processed integer not null default 0,
  creators_succeeded integer not null default 0,
  creators_failed integer not null default 0,
  videos_upserted integer not null default 0,
  payouts_upserted integer not null default 0,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_creators_campaign_id on public.creators(campaign_id);
create index if not exists idx_videos_creator_id on public.videos(creator_id);
create index if not exists idx_videos_published_at on public.videos(published_at desc);
create index if not exists idx_videos_is_short on public.videos(is_short);
create index if not exists idx_weekly_payouts_week_start on public.weekly_payouts(week_start_date desc);
create index if not exists idx_sync_runs_started_at on public.sync_runs(started_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists set_creators_updated_at on public.creators;
create trigger set_creators_updated_at
before update on public.creators
for each row execute function public.set_updated_at();

drop trigger if exists set_videos_updated_at on public.videos;
create trigger set_videos_updated_at
before update on public.videos
for each row execute function public.set_updated_at();

drop trigger if exists set_weekly_payouts_updated_at on public.weekly_payouts;
create trigger set_weekly_payouts_updated_at
before update on public.weekly_payouts
for each row execute function public.set_updated_at();

alter table public.campaigns enable row level security;
alter table public.creators enable row level security;
alter table public.videos enable row level security;
alter table public.weekly_payouts enable row level security;
alter table public.sync_runs enable row level security;

drop policy if exists "authenticated full access campaigns" on public.campaigns;
create policy "authenticated full access campaigns"
on public.campaigns
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated full access creators" on public.creators;
create policy "authenticated full access creators"
on public.creators
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated full access videos" on public.videos;
create policy "authenticated full access videos"
on public.videos
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated full access weekly_payouts" on public.weekly_payouts;
create policy "authenticated full access weekly_payouts"
on public.weekly_payouts
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated full access sync_runs" on public.sync_runs;
create policy "authenticated full access sync_runs"
on public.sync_runs
for all
to authenticated
using (true)
with check (true);
