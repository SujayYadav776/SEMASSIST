-- Run this once in Supabase Dashboard → SQL Editor.
-- Email/password authentication is provided by Supabase Auth; enable Email
-- under Authentication → Providers, and configure the Site URL for deployment.
--
-- Safe to re-run: tables use "if not exists", functions use "create or
-- replace", and every policy is dropped before it is created (plain
-- "create policy" fails with duplicate_object the second time around).

create table if not exists public.study_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.study_progress enable row level security;

drop policy if exists "Users can read their own study progress" on public.study_progress;
create policy "Users can read their own study progress"
  on public.study_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own study progress" on public.study_progress;
create policy "Users can create their own study progress"
  on public.study_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own study progress" on public.study_progress;
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
-- checkpoint subtracts 10. The board resets every Monday in the viewer's local
-- week, matching the dashboard's weekly rhythm chart (the caller passes its
-- local Monday to earn_points; see the validation there).
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
drop policy if exists "Signed-in users can read the weekly leaderboard" on public.weekly_points;
create policy "Signed-in users can read the weekly leaderboard"
  on public.weekly_points for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own weekly points" on public.weekly_points;
create policy "Users can insert their own weekly points"
  on public.weekly_points for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own weekly points" on public.weekly_points;
create policy "Users can update their own weekly points"
  on public.weekly_points for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Atomic add/subtract of points for the caller's own row in a given week.
-- Runs as the table owner so it can upsert despite RLS, but it verifies the
-- target user_id against auth.uid() first, so no user can award anyone else.
-- p_display_name: NULL leaves the stored nickname untouched (so awarding points
-- never wipes a name), any explicit value — including '' — replaces it. Names
-- are clamped to 16 characters here as well as in the client.
-- p_week_start: the caller's local Monday, which is the week boundary the
-- dashboard's weekly rhythm chart uses. NULL falls back to the UTC week. Time
-- zones span UTC-12…UTC+14, so a legitimate local Monday is the UTC week start
-- or exactly one week either side of it. Anything else is rejected rather than
-- trusted, so a tampered key cannot write points into an arbitrary week.
create or replace function public.earn_points(
  p_user_id uuid,
  p_amount integer,
  p_display_name text default null,
  p_week_start date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  utc_week date := date_trunc('week', now())::date;
  target_week date := p_week_start;
begin
  if p_user_id is distinct from (select auth.uid()) then
    raise exception 'You can only award points to yourself';
  end if;
  if target_week is null then
    target_week := utc_week;
  elsif extract(isodow from target_week) <> 1
        or abs(target_week - utc_week) > 7 then
    raise exception 'Invalid week start %: expected a Monday in the current local week',
      target_week;
  end if;
  insert into public.weekly_points (user_id, week_start, points, display_name)
  values (
    p_user_id,
    target_week,
    p_amount,
    coalesce(left(p_display_name, 16), '')
  )
  on conflict (user_id, week_start)
  do update set
    points = public.weekly_points.points + excluded.points,
    -- excluded.display_name cannot tell NULL from '', so read the parameter.
    display_name = case
      when p_display_name is null then public.weekly_points.display_name
      else left(p_display_name, 16)
    end,
    updated_at = now();
end;
$$;

-- The 3-argument form (UTC weeks) is retired: keeping it would leave a
-- 3-argument call ambiguous between the two overloads.
drop function if exists public.earn_points(uuid, integer, text);

grant execute on function public.earn_points(uuid, integer, text, date) to authenticated;
