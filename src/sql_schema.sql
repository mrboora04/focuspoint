-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.user_profile (
  user_id text primary key,
  focus_points numeric default 0,
  current_streak numeric default 0,
  best_streak numeric default 0,
  missions_completed numeric default 0,
  missions_failed numeric default 0,
  last_active timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 2. EVENTS
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  event_type text not null,
  event_value numeric,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- 3. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  type text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- 4. MISSIONS (Refined Relational Structure)
create table if not exists public.missions (
  id text primary key,
  user_id text not null,
  title text not null,           -- Core data
  status text default 'active',  -- active, completed, failed
  points numeric default 0,      -- Current score/points for this mission
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  data jsonb not null            -- Remaining complex data (history, logs, detailed config)
);

-- 5. TAP TARGETS (Refined Relational Structure)
create table if not exists public.tap_targets (
  id text primary key,
  user_id text not null,
  title text not null,
  current_count numeric default 0,
  target_count numeric default 0,
  is_completed boolean default false,
  created_at timestamp with time zone default now(),
  data jsonb                     -- Optional extra data
);

-- RLS POLICIES
alter table public.user_profile enable row level security;
alter table public.events enable row level security;
alter table public.notifications enable row level security;
alter table public.missions enable row level security;
alter table public.tap_targets enable row level security;

-- Open Access Policies (for development/anon key usage as per env)
create policy "Allow all access" on public.user_profile for all using (true) with check (true);
create policy "Allow all access" on public.events for all using (true) with check (true);
create policy "Allow all access" on public.notifications for all using (true) with check (true);
create policy "Allow all access" on public.missions for all using (true) with check (true);
create policy "Allow all access" on public.tap_targets for all using (true) with check (true);
