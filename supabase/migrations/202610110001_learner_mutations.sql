-- Apply after 202610100001. Browser writes go through the validated mutation function.
create table public.roadmap_assignment_moves (
  owner_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null,
  assignment_id uuid not null,
  schedule_id uuid not null,
  date date not null,
  override_reason text not null default '' check (char_length(override_reason) <= 10000),
  revision bigint not null default 0,
  primary key(owner_id, roadmap_id, assignment_id),
  foreign key(owner_id, roadmap_id, schedule_id) references public.roadmap_schedules(owner_id, roadmap_id, schedule_id) on delete cascade
);
create trigger roadmap_moves_revision before insert or update or delete on public.roadmap_assignment_moves
  for each row execute function public.bump_roadmap_learner_revision();
alter table public.roadmap_assignment_moves enable row level security;
create policy owner_read on public.roadmap_assignment_moves for select to authenticated using(owner_id = (select auth.uid()));
grant select on public.roadmap_assignment_moves to authenticated;
grant all on public.roadmap_assignment_moves to service_role;
revoke insert, update, delete on public.roadmap_task_progress, public.roadmap_task_notes,
  public.roadmap_topic_mastery, public.roadmap_study_time, public.roadmap_milestone_evidence from authenticated;

create table public.roadmap_mutation_receipts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  request jsonb not null,
  result jsonb not null,
  primary key(owner_id, mutation_id)
);
alter table public.roadmap_mutation_receipts enable row level security;
revoke all on public.roadmap_mutation_receipts from anon, authenticated;
grant all on public.roadmap_mutation_receipts to service_role;

create function public.read_roadmap_learner_record(p_owner uuid, p_roadmap uuid, p_entity uuid, p_kind text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare value jsonb; rev bigint; data jsonb;
begin
  case p_kind
  when 'completion' then
    select revision, jsonb_build_object('state',state,'completedAt',case when completed_at is null then null else to_char(completed_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end) into rev,data from public.roadmap_task_progress where owner_id=p_owner and roadmap_id=p_roadmap and task_id=p_entity;
    data := coalesce(data,'{"state":"incomplete","completedAt":null}');
  when 'note' then
    select revision,jsonb_build_object('text',text) into rev,data from public.roadmap_task_notes where owner_id=p_owner and roadmap_id=p_roadmap and task_id=p_entity;
    data := coalesce(data,'{"text":""}');
  when 'mastery' then
    select revision,jsonb_build_object('state',state,'evidence',evidence) into rev,data from public.roadmap_topic_mastery where owner_id=p_owner and roadmap_id=p_roadmap and topic_id=p_entity;
    data := coalesce(data,'{"state":"not-assessed","evidence":""}');
  when 'milestone' then
    select revision,jsonb_build_object('state',state,'evidence',evidence) into rev,data from public.roadmap_milestone_evidence where owner_id=p_owner and roadmap_id=p_roadmap and milestone_id=p_entity;
    data := coalesce(data,'{"state":"not-assessed","evidence":""}');
  when 'study-time' then
    select server_revision,jsonb_build_object('taskId',task_id,'minutes',minutes,'recordedAt',to_char(recorded_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) into rev,data from public.roadmap_study_time where owner_id=p_owner and roadmap_id=p_roadmap and entry_id=p_entity;
  when 'assignment' then
    select revision,jsonb_build_object('scheduleId',schedule_id,'date',date,'overrideReason',override_reason) into rev,data from public.roadmap_assignment_moves where owner_id=p_owner and roadmap_id=p_roadmap and assignment_id=p_entity;
  else raise exception 'Unsupported learner record';
  end case;
  value := jsonb_build_object('revision',coalesce(rev,0),'data',coalesce(data,'{}'));
  return value;
end $$;
revoke all on function public.read_roadmap_learner_record(uuid,uuid,uuid,text) from public,anon,authenticated;

create function public.commit_roadmap_mutation(p_owner_id uuid,p_mutation jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  roadmap uuid := (p_mutation->>'roadmapId')::uuid;
  entity uuid := (p_mutation->>'entityId')::uuid;
  mutation uuid := (p_mutation->>'mutationId')::uuid;
  kind text := p_mutation #>> '{payload,kind}';
  changes jsonb := p_mutation #> '{payload,changes}';
  base jsonb := p_mutation->'base';
  current_record jsonb; next_data jsonb; result jsonb; receipt public.roadmap_mutation_receipts;
  content jsonb; schedule jsonb; field text; conflicting boolean := false;
begin
  if p_mutation->>'accountId' is distinct from p_owner_id::text then raise exception 'Account mismatch'; end if;
  perform 1 from public.roadmaps where owner_id=p_owner_id and roadmap_id=roadmap for update;
  if not found then raise exception 'Roadmap not found'; end if;
  select * into receipt from public.roadmap_mutation_receipts where owner_id=p_owner_id and mutation_id=mutation;
  if found then
    if receipt.request <> p_mutation then raise exception 'Mutation ID reused with different data'; end if;
    return receipt.result;
  end if;
  select r.content into content from public.roadmap_revisions r join public.roadmaps m
    on m.owner_id=r.owner_id and m.roadmap_id=r.roadmap_id and m.active_revision_id=r.revision_id
    where m.owner_id=p_owner_id and m.roadmap_id=roadmap;
  if kind in ('completion','note','study-time') then
    if not exists(select 1 from jsonb_array_elements(content->'tasks') t where t->>'taskId'=case when kind='study-time' then changes->>'taskId' else entity::text end) then raise exception 'Task is not in the active revision'; end if;
  elsif kind='mastery' then
    if not exists(select 1 from jsonb_array_elements(content->'topics') t where t->>'topicId'=entity::text) then raise exception 'Topic is not active'; end if;
  elsif kind='milestone' then
    if not exists(select 1 from jsonb_array_elements(content->'milestones') t where t->>'milestoneId'=entity::text) then raise exception 'Milestone is not active'; end if;
  elsif kind='assignment' then
    select s.package_json into schedule from public.roadmap_schedules s join public.roadmaps m
      on m.owner_id=s.owner_id and m.roadmap_id=s.roadmap_id and m.active_revision_id=s.revision_id
      where s.owner_id=p_owner_id and s.roadmap_id=roadmap and s.schedule_id=(changes->>'scheduleId')::uuid;
    if not exists(select 1 from jsonb_array_elements(schedule->'assignments') a where a->>'assignmentId'=entity::text) then raise exception 'Assignment not found in this schedule'; end if;
  else raise exception 'Unsupported mutation kind'; end if;
  current_record := public.read_roadmap_learner_record(p_owner_id,roadmap,entity,kind);
  if (p_mutation->>'baselineRevision')::bigint > (current_record->>'revision')::bigint then raise exception 'Future baseline revision'; end if;
  if (p_mutation->>'baselineRevision')::bigint <> (current_record->>'revision')::bigint then
    for field in select jsonb_object_keys(changes) loop
      if current_record->'data'->field is distinct from base->field and current_record->'data'->field is distinct from changes->field then conflicting := true; end if;
    end loop;
  end if;
  if conflicting then result := jsonb_build_object('status','conflict','record',current_record);
  else
    next_data := (current_record->'data') || changes;
    case kind
    when 'completion' then insert into public.roadmap_task_progress(owner_id,roadmap_id,task_id,state,completed_at)
      values(p_owner_id,roadmap,entity,next_data->>'state',(next_data->>'completedAt')::timestamptz)
      on conflict(owner_id,roadmap_id,task_id) do update set state=excluded.state,completed_at=excluded.completed_at;
    when 'note' then insert into public.roadmap_task_notes(owner_id,roadmap_id,task_id,text) values(p_owner_id,roadmap,entity,next_data->>'text')
      on conflict(owner_id,roadmap_id,task_id) do update set text=excluded.text;
    when 'mastery' then insert into public.roadmap_topic_mastery(owner_id,roadmap_id,topic_id,state,evidence) values(p_owner_id,roadmap,entity,next_data->>'state',next_data->>'evidence')
      on conflict(owner_id,roadmap_id,topic_id) do update set state=excluded.state,evidence=excluded.evidence;
    when 'milestone' then insert into public.roadmap_milestone_evidence(owner_id,roadmap_id,milestone_id,state,evidence) values(p_owner_id,roadmap,entity,next_data->>'state',next_data->>'evidence')
      on conflict(owner_id,roadmap_id,milestone_id) do update set state=excluded.state,evidence=excluded.evidence;
    when 'study-time' then
      if (current_record->>'revision')::bigint > 0 then raise exception 'Study time entry is immutable; use a new entry ID'; end if;
      insert into public.roadmap_study_time(owner_id,roadmap_id,entry_id,task_id,minutes,recorded_at) values(p_owner_id,roadmap,entity,(next_data->>'taskId')::uuid,(next_data->>'minutes')::integer,(next_data->>'recordedAt')::timestamptz);
    when 'assignment' then insert into public.roadmap_assignment_moves(owner_id,roadmap_id,assignment_id,schedule_id,date,override_reason)
      values(p_owner_id,roadmap,entity,(next_data->>'scheduleId')::uuid,(next_data->>'date')::date,next_data->>'overrideReason')
      on conflict(owner_id,roadmap_id,assignment_id) do update set date=excluded.date,override_reason=excluded.override_reason,schedule_id=excluded.schedule_id;
    end case;
    result := jsonb_build_object('status','acknowledged','record',public.read_roadmap_learner_record(p_owner_id,roadmap,entity,kind));
  end if;
  insert into public.roadmap_mutation_receipts values(p_owner_id,mutation,p_mutation,result);
  return result;
end $$;
revoke all on function public.commit_roadmap_mutation(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.commit_roadmap_mutation(uuid,jsonb) to service_role;
