-- Create the missions table
create table public.missions (
  id text not null primary key,
  user_id uuid references auth.users not null,
  name text not null,
  config jsonb not null, -- Stores duration, dailyTarget, habits, penalty, buffer
  history jsonb,         -- Stores the completion/failure history
  daily_log jsonb,       -- Stores daily task logs
  today_score integer default 0,
  score_date text,
  is_archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.missions enable row level security;

-- Create Policy: Users can only see their own missions
create policy "Users can view own missions"
  on missions for select
  using ( auth.uid() = user_id );

-- Create Policy: Users can insert their own missions
create policy "Users can insert own missions"
  on missions for insert
  with check ( auth.uid() = user_id );

-- Create Policy: Users can update their own missions
create policy "Users can update own missions"
  on missions for update
  using ( auth.uid() = user_id );

-- Create Policy: Users can delete their own missions
create policy "Users can delete own missions"
  on missions for delete
  using ( auth.uid() = user_id );
