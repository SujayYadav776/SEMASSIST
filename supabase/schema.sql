-- Run this once in Supabase Dashboard → SQL Editor.
-- Email/password authentication is provided by Supabase Auth; enable Email
-- under Authentication → Providers, and configure the Site URL for deployment.

create table if not exists public.study_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.study_progress enable row level security;

create policy "Users can read their own study progress"
  on public.study_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own study progress"
  on public.study_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own study progress"
  on public.study_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- Weekly leaderboard.
-- Points are public by design (that is the point of a leaderboard) and are
-- awarded client-side via earn_points(), which is security definer but refuses
-- to touch any row whose user_id is not the caller's own auth.uid().
-- Points: +10 per verified checkpoint, +1 per focus minute; unverifying a
-- checkpoint subtracts 10. The board resets every Monday (UTC).
-- ============================================================================
create table if not exists public.weekly_points (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  points integer not null default 0,
  display_name text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.weekly_points enable row level security;

-- The leaderboard is meant to be read by every signed-in user.
create policy "Signed-in users can read the weekly leaderboard"
  on public.weekly_points for select
  to authenticated
  using (true);

create policy "Users can insert their own weekly points"
  on public.weekly_points for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own weekly points"
  on public.weekly_points for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Atomic add/subtract of points for the caller's own row in the current week.
-- Runs as the table owner so it can upsert despite RLS, but it verifies the
-- target user_id against auth.uid() first, so no user can award anyone else.
create or replace function public.earn_points(
  p_user_id uuid,
  p_amount integer,
  p_display_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is distinct from (select auth.uid()) then
    raise exception 'You can only award points to yourself';
  end if;
  insert into public.weekly_points (user_id, week_start, points, display_name)
  values (
    p_user_id,
    date_trunc('week', now())::date,
    p_amount,
    coalesce(p_display_name, '')
  )
  on conflict (user_id, week_start)
  do update set
    points = public.weekly_points.points + excluded.points,
    display_name = case
      when excluded.display_name <> '' then excluded.display_name
      else public.weekly_points.display_name
    end,
    updated_at = now();
end;
$$;

grant execute on function public.earn_points(uuid, integer, text) to authenticated;
