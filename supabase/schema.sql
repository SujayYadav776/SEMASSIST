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
