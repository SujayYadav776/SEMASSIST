-- Account-scoped roadmap storage. Apply after supabase/schema.sql.
create table if not exists public.roadmaps (
  owner_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null,
  title text not null,
  subject text,
  level text,
  goals jsonb not null default '[]'::jsonb,
  active_revision_id uuid,
  active_schedule_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, roadmap_id)
);

create table if not exists public.roadmap_revisions (
  owner_id uuid not null,
  roadmap_id uuid not null,
  revision_id uuid not null,
  predecessor_revision_id uuid,
  content jsonb not null,
  package_json jsonb not null,
  digest text not null check (digest ~ '^[0-9a-f]{64}$'),
  server_revision bigint generated always as identity,
  created_at timestamptz not null default now(),
  primary key (owner_id, roadmap_id, revision_id),
  foreign key (owner_id, roadmap_id) references public.roadmaps(owner_id, roadmap_id) on delete cascade,
  foreign key (owner_id, roadmap_id, predecessor_revision_id) references public.roadmap_revisions(owner_id, roadmap_id, revision_id) deferrable initially deferred
);

create table if not exists public.roadmap_schedules (
  owner_id uuid not null,
  roadmap_id uuid not null,
  schedule_id uuid not null,
  revision_id uuid not null,
  package_json jsonb not null,
  server_revision bigint generated always as identity,
  created_at timestamptz not null default now(),
  primary key (owner_id, roadmap_id, schedule_id),
  foreign key (owner_id, roadmap_id) references public.roadmaps(owner_id, roadmap_id) on delete cascade,
  foreign key (owner_id, roadmap_id, revision_id) references public.roadmap_revisions(owner_id, roadmap_id, revision_id)
);

alter table public.roadmaps drop constraint if exists roadmaps_active_revision_fk;
alter table public.roadmaps add constraint roadmaps_active_revision_fk
  foreign key (owner_id, roadmap_id, active_revision_id)
  references public.roadmap_revisions(owner_id, roadmap_id, revision_id) deferrable initially deferred;
alter table public.roadmaps drop constraint if exists roadmaps_active_schedule_fk;
alter table public.roadmaps add constraint roadmaps_active_schedule_fk
  foreign key (owner_id, roadmap_id, active_schedule_id)
  references public.roadmap_schedules(owner_id, roadmap_id, schedule_id) deferrable initially deferred;

create table if not exists public.roadmap_task_progress (
  owner_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null,
  task_id uuid not null,
  state text not null check (state in ('incomplete', 'completed')),
  completed_at timestamptz,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (owner_id, roadmap_id, task_id),
  foreign key (owner_id, roadmap_id) references public.roadmaps(owner_id, roadmap_id) on delete cascade,
  check ((state = 'completed') = (completed_at is not null))
);

create table if not exists public.roadmap_task_notes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null,
  task_id uuid not null,
  text text not null default '' check (char_length(text) <= 10000),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (owner_id, roadmap_id, task_id),
  foreign key (owner_id, roadmap_id) references public.roadmaps(owner_id, roadmap_id) on delete cascade
);

create table if not exists public.roadmap_topic_mastery (
  owner_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null,
  topic_id uuid not null,
  state text not null check (state in ('not-assessed', 'developing', 'demonstrated')),
  evidence text not null default '' check (char_length(evidence) <= 10000),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (owner_id, roadmap_id, topic_id),
  foreign key (owner_id, roadmap_id) references public.roadmaps(owner_id, roadmap_id) on delete cascade
);

create table if not exists public.roadmap_study_time (
  owner_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null,
  roadmap_id uuid not null,
  task_id uuid not null,
  minutes integer not null check (minutes between 1 and 1440),
  recorded_at timestamptz not null,
  server_revision bigint generated always as identity,
  primary key (owner_id, entry_id),
  foreign key (owner_id, roadmap_id) references public.roadmaps(owner_id, roadmap_id) on delete cascade
);

create table if not exists public.roadmap_milestone_evidence (
  owner_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null,
  milestone_id uuid not null,
  state text not null check (state in ('not-assessed', 'in-progress', 'demonstrated')),
  evidence text not null default '' check (char_length(evidence) <= 10000),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (owner_id, roadmap_id, milestone_id),
  foreign key (owner_id, roadmap_id) references public.roadmaps(owner_id, roadmap_id) on delete cascade
);

create table if not exists public.roadmap_learner_state (
  owner_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (owner_id, roadmap_id),
  foreign key (owner_id, roadmap_id) references public.roadmaps(owner_id, roadmap_id) on delete cascade
);

create table if not exists public.roadmap_import_receipts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  import_id uuid not null,
  digest text not null check (digest ~ '^[0-9a-f]{64}$'),
  roadmap_id uuid not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, import_id)
);

create or replace function public.bump_roadmap_learner_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner uuid; roadmap uuid; next_revision bigint;
begin
  owner := coalesce(new.owner_id, old.owner_id);
  roadmap := coalesce(new.roadmap_id, old.roadmap_id);
  perform 1 from public.roadmaps where owner_id = owner and roadmap_id = roadmap for update;
  if not found then
    if tg_op = 'DELETE' then return old; end if; -- Parent deletion cascades without bumping a vanished roadmap.
    raise exception 'Roadmap not found';
  end if;
  insert into public.roadmap_learner_state(owner_id, roadmap_id, revision)
    values(owner, roadmap, 1)
    on conflict(owner_id, roadmap_id) do update
      set revision = public.roadmap_learner_state.revision + 1, updated_at = now()
    returning revision into next_revision;
  if tg_op = 'DELETE' then return old; end if;
  new.revision := next_revision;
  return new;
end $$;

create or replace function public.bump_roadmap_study_time_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner uuid; roadmap uuid;
begin
  owner := coalesce(new.owner_id, old.owner_id);
  roadmap := coalesce(new.roadmap_id, old.roadmap_id);
  perform 1 from public.roadmaps where owner_id = owner and roadmap_id = roadmap for update;
  if not found then
    if tg_op = 'DELETE' then return old; end if; -- Parent deletion cascades without bumping a vanished roadmap.
    raise exception 'Roadmap not found';
  end if;
  insert into public.roadmap_learner_state(owner_id, roadmap_id, revision)
    values(owner, roadmap, 1)
    on conflict(owner_id, roadmap_id) do update
      set revision = public.roadmap_learner_state.revision + 1, updated_at = now();
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists roadmap_progress_revision on public.roadmap_task_progress;
create trigger roadmap_progress_revision before insert or update or delete on public.roadmap_task_progress for each row execute function public.bump_roadmap_learner_revision();
drop trigger if exists roadmap_notes_revision on public.roadmap_task_notes;
create trigger roadmap_notes_revision before insert or update or delete on public.roadmap_task_notes for each row execute function public.bump_roadmap_learner_revision();
drop trigger if exists roadmap_mastery_revision on public.roadmap_topic_mastery;
create trigger roadmap_mastery_revision before insert or update or delete on public.roadmap_topic_mastery for each row execute function public.bump_roadmap_learner_revision();
drop trigger if exists roadmap_milestone_revision on public.roadmap_milestone_evidence;
create trigger roadmap_milestone_revision before insert or update or delete on public.roadmap_milestone_evidence for each row execute function public.bump_roadmap_learner_revision();
drop trigger if exists roadmap_study_time_revision on public.roadmap_study_time;
create trigger roadmap_study_time_revision after insert or delete on public.roadmap_study_time for each row execute function public.bump_roadmap_study_time_revision();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'roadmaps', 'roadmap_revisions', 'roadmap_schedules',
    'roadmap_task_progress', 'roadmap_task_notes', 'roadmap_topic_mastery',
    'roadmap_study_time', 'roadmap_milestone_evidence'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists owner_access on public.%I', table_name);
    execute format('create policy owner_access on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

alter table public.roadmap_learner_state enable row level security;
drop policy if exists owner_read on public.roadmap_learner_state;
create policy owner_read on public.roadmap_learner_state for select to authenticated using (owner_id = (select auth.uid()));
grant select on public.roadmap_learner_state to authenticated;
revoke insert, update, delete on public.roadmap_learner_state from anon, authenticated;

revoke insert on public.roadmaps from authenticated;
revoke insert, update, delete on public.roadmap_revisions, public.roadmap_schedules from authenticated;
grant select on public.roadmap_revisions, public.roadmap_schedules to authenticated;

alter table public.roadmap_import_receipts enable row level security;
revoke all on public.roadmap_import_receipts from anon, authenticated;
grant all on public.roadmap_import_receipts to service_role;

-- Only the validated Edge Function calls this service-role-only transaction.
create or replace function public.commit_roadmap_import(
  p_owner_id uuid,
  p_import_id uuid,
  p_digest text,
  p_package jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  pkg jsonb := p_package;
  r_id uuid := (pkg #>> '{roadmap,roadmapId}')::uuid;
  rev_id uuid := (pkg #>> '{content,revisionId}')::uuid;
  sched_id uuid := (pkg #>> '{schedules,0,scheduleId}')::uuid;
  kind text := pkg->>'importKind';
  base_id uuid := nullif(pkg #>> '{baseline,revisionId}', '')::uuid;
  base_schedule uuid := nullif(pkg #>> '{baseline,scheduleId}', '')::uuid;
  current_content jsonb;
  current_package jsonb;
  current_revision uuid;
  current_schedule uuid;
  recorded_revision bigint;
  claimed_revision bigint;
  actual_tasks uuid[];
  claimed_tasks uuid[];
  actual_completed uuid[];
  claimed_completed uuid[];
  previous_receipt jsonb;
  result jsonb;
begin
  if p_owner_id is null or p_import_id is null or p_digest !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid import identity';
  end if;
  select receipt.result into previous_receipt from public.roadmap_import_receipts receipt
    where receipt.owner_id = p_owner_id and receipt.import_id = p_import_id;
  if found then
    if (previous_receipt->>'digest') <> p_digest then raise exception 'Import ID was already used for different content'; end if;
    return previous_receipt->'result';
  end if;
  if kind not in ('new', 'revision', 'schedule') or r_id is null or rev_id is null or sched_id is null then
    raise exception 'Invalid roadmap import';
  end if;
  select active_revision_id, active_schedule_id into current_revision, current_schedule
    from public.roadmaps where owner_id = p_owner_id and roadmap_id = r_id for update;
  if not found then
    if kind <> 'new' or base_id is not null then raise exception 'Roadmap baseline not found'; end if;
    insert into public.roadmaps(owner_id, roadmap_id, title, subject, level, goals)
    values (p_owner_id, r_id, pkg #>> '{roadmap,title}', pkg #>> '{roadmap,subject}', pkg #>> '{roadmap,level}', pkg #> '{roadmap,goals}');
  else
    if kind = 'new' then raise exception 'Roadmap already exists; use a revision import'; end if;
    if base_id is null or base_schedule is distinct from current_schedule or base_id is distinct from current_revision then
      raise exception 'Roadmap changed since this package was prepared';
    end if;
    select content, package_json into current_content, current_package from public.roadmap_revisions
      where owner_id = p_owner_id and roadmap_id = r_id and revision_id = current_revision;
    select revision into recorded_revision from public.roadmap_learner_state
      where owner_id = p_owner_id and roadmap_id = r_id for update;
    recorded_revision := coalesce(recorded_revision, 0);
    claimed_revision := coalesce((pkg #>> '{baseline,learnerRevision}')::bigint, 0);
    if recorded_revision <> claimed_revision then raise exception 'Learner progress changed since this package was prepared'; end if;
    select coalesce(array_agg((t->>'taskId')::uuid order by (t->>'taskId')::uuid), '{}'::uuid[]) into actual_tasks
      from jsonb_array_elements(current_content->'tasks') t;
    select coalesce(array_agg(value::uuid order by value::uuid), '{}'::uuid[]) into claimed_tasks
      from jsonb_array_elements_text(pkg #> '{baseline,taskIds}') value;
    if actual_tasks <> claimed_tasks then raise exception 'Baseline task identities do not match stored content'; end if;
    select coalesce(array_agg(task_id order by task_id), '{}'::uuid[]) into actual_completed
      from public.roadmap_task_progress where owner_id = p_owner_id and roadmap_id = r_id and state = 'completed' and task_id = any(actual_tasks);
    select coalesce(array_agg(value::uuid order by value::uuid), '{}'::uuid[]) into claimed_completed
      from jsonb_array_elements_text(pkg #> '{baseline,completedTaskIds}') value;
    if actual_completed <> claimed_completed then raise exception 'Completed tasks changed since this package was prepared'; end if;
    if kind = 'schedule' then
      if rev_id <> current_revision or pkg->'content' <> current_content then raise exception 'Schedule imports cannot change roadmap content'; end if;
    else
      if nullif(pkg #>> '{content,predecessorRevisionId}', '')::uuid is distinct from current_revision or rev_id = current_revision then
        raise exception 'Revision must identify the current revision as its predecessor';
      end if;
    end if;
    update public.roadmaps set title = pkg #>> '{roadmap,title}', subject = pkg #>> '{roadmap,subject}', level = pkg #>> '{roadmap,level}', goals = pkg #> '{roadmap,goals}', updated_at = now()
      where owner_id = p_owner_id and roadmap_id = r_id;
  end if;
  if kind <> 'schedule' then
    insert into public.roadmap_revisions(owner_id, roadmap_id, revision_id, predecessor_revision_id, content, package_json, digest)
    values (p_owner_id, r_id, rev_id, case when kind = 'new' then null else current_revision end, pkg->'content', pkg, p_digest);
  else
    select package_json into current_package from public.roadmap_revisions where owner_id = p_owner_id and roadmap_id = r_id and revision_id = rev_id;
  end if;
  insert into public.roadmap_schedules(owner_id, roadmap_id, schedule_id, revision_id, package_json)
    values (p_owner_id, r_id, sched_id, rev_id, pkg->'schedules'->0)
    on conflict (owner_id, roadmap_id, schedule_id) do nothing;
  if not found and not exists (select 1 from public.roadmap_schedules where owner_id = p_owner_id and roadmap_id = r_id and schedule_id = sched_id and revision_id = rev_id and package_json = pkg->'schedules'->0) then
    raise exception 'Schedule ID already exists with different content';
  end if;
  update public.roadmaps set active_revision_id = rev_id, active_schedule_id = sched_id, archived_at = null, updated_at = now()
    where owner_id = p_owner_id and roadmap_id = r_id;
  result := jsonb_build_object('roadmapId', r_id, 'revisionId', rev_id, 'scheduleId', sched_id, 'digest', p_digest);
  insert into public.roadmap_import_receipts(owner_id, import_id, digest, roadmap_id, result)
    values (p_owner_id, p_import_id, p_digest, r_id, jsonb_build_object('digest', p_digest, 'result', result));
  return result;
end $$;

revoke all on function public.commit_roadmap_import(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.commit_roadmap_import(uuid, uuid, text, jsonb) to service_role;

create or replace function public.activate_roadmap_schedule(p_roadmap_id uuid, p_schedule_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare current_revision uuid; schedule_revision uuid;
begin
  select active_revision_id into current_revision from public.roadmaps
    where owner_id = (select auth.uid()) and roadmap_id = p_roadmap_id for update;
  if not found then raise exception 'Roadmap not found'; end if;
  select revision_id into schedule_revision from public.roadmap_schedules
    where owner_id = (select auth.uid()) and roadmap_id = p_roadmap_id and schedule_id = p_schedule_id;
  if schedule_revision is distinct from current_revision then raise exception 'Schedule does not match the active content revision'; end if;
  update public.roadmaps set active_schedule_id = p_schedule_id, updated_at = now()
    where owner_id = (select auth.uid()) and roadmap_id = p_roadmap_id;
end $$;

create or replace function public.restore_roadmap_revision(p_roadmap_id uuid, p_revision_id uuid, p_schedule_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare saved_package jsonb;
begin
  select package_json into saved_package from public.roadmap_revisions
    where owner_id = (select auth.uid()) and roadmap_id = p_roadmap_id and revision_id = p_revision_id;
  if not found then raise exception 'Revision not found'; end if;
  if not exists (select 1 from public.roadmap_schedules where owner_id = (select auth.uid()) and roadmap_id = p_roadmap_id and schedule_id = p_schedule_id and revision_id = p_revision_id) then
    raise exception 'Schedule does not belong to this revision';
  end if;
  update public.roadmaps set active_revision_id = p_revision_id, active_schedule_id = p_schedule_id,
    title = saved_package #>> '{roadmap,title}', subject = saved_package #>> '{roadmap,subject}',
    level = saved_package #>> '{roadmap,level}', goals = saved_package #> '{roadmap,goals}',
    archived_at = null, updated_at = now()
    where owner_id = (select auth.uid()) and roadmap_id = p_roadmap_id;
  if not found then raise exception 'Roadmap not found'; end if;
end $$;

revoke all on function public.activate_roadmap_schedule(uuid, uuid) from public, anon;
revoke all on function public.restore_roadmap_revision(uuid, uuid, uuid) from public, anon;
grant execute on function public.activate_roadmap_schedule(uuid, uuid) to authenticated;
grant execute on function public.restore_roadmap_revision(uuid, uuid, uuid) to authenticated;
