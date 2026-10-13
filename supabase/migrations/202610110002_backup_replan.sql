-- Apply after the library and learner-mutation migrations.
-- Every operation for an account shares this lock, including empty-account restores.
alter function public.commit_roadmap_import(uuid,uuid,text,jsonb) rename to commit_roadmap_import_internal;
alter function public.commit_roadmap_mutation(uuid,jsonb) rename to commit_roadmap_mutation_internal;
revoke all on function public.commit_roadmap_import_internal(uuid,uuid,text,jsonb), public.commit_roadmap_mutation_internal(uuid,jsonb) from service_role;
revoke all on function public.activate_roadmap_schedule(uuid,uuid), public.restore_roadmap_revision(uuid,uuid,uuid) from public,anon,authenticated;
revoke update,delete on public.roadmaps from authenticated;

create function public.roadmap_account_backup(p_owner uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item public.roadmaps; packages jsonb; records jsonb; result jsonb := '[]';
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text,0));
  for item in select * from public.roadmaps where owner_id=p_owner order by roadmap_id for update loop
    select coalesce(jsonb_agg(r.package_json order by r.revision_id),'[]') into packages from public.roadmap_revisions r where r.owner_id=p_owner and r.roadmap_id=item.roadmap_id;
    select coalesce(jsonb_agg(jsonb_build_object('kind',e.kind,'entityId',e.id) || public.read_roadmap_learner_record(p_owner,item.roadmap_id,e.id,e.kind) order by e.kind,e.id),'[]') into records from (
      select 'completion' kind,task_id id from public.roadmap_task_progress where owner_id=p_owner and roadmap_id=item.roadmap_id
      union all select 'note',task_id from public.roadmap_task_notes where owner_id=p_owner and roadmap_id=item.roadmap_id
      union all select 'mastery',topic_id from public.roadmap_topic_mastery where owner_id=p_owner and roadmap_id=item.roadmap_id
      union all select 'milestone',milestone_id from public.roadmap_milestone_evidence where owner_id=p_owner and roadmap_id=item.roadmap_id
      union all select 'study-time',entry_id from public.roadmap_study_time where owner_id=p_owner and roadmap_id=item.roadmap_id
      union all select 'assignment',assignment_id from public.roadmap_assignment_moves where owner_id=p_owner and roadmap_id=item.roadmap_id
    ) e;
    result := result || jsonb_build_array(jsonb_build_object('roadmapId',item.roadmap_id,'activeRevisionId',item.active_revision_id,'activeScheduleId',item.active_schedule_id,'archivedAt',case when item.archived_at is null then null else to_char(item.archived_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end,'learnerRevision',coalesce((select revision from public.roadmap_learner_state where owner_id=p_owner and roadmap_id=item.roadmap_id),0),'packages',packages,'schedules',coalesce((select jsonb_agg(package_json order by schedule_id) from public.roadmap_schedules where owner_id=p_owner and roadmap_id=item.roadmap_id),'[]'),'records',records));
  end loop;
  return jsonb_build_object('format','semassist-backup','version',1,'exportedAt',to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'sourceAccount',p_owner,'roadmaps',result);
end $$;

create function public.commit_roadmap_mutation(p_owner_id uuid,p_mutation jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner_id::text,0));
  return public.commit_roadmap_mutation_internal(p_owner_id,p_mutation);
end $$;

create function public.commit_roadmap_import(p_owner_id uuid,p_import_id uuid,p_digest text,p_package jsonb,p_decisions jsonb default '[]') returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; s jsonb; m jsonb; decision text; target uuid; note text; completed timestamptz; r uuid := (p_package #>> '{roadmap,roadmapId}')::uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner_id::text,0));
  if exists(select 1 from public.roadmap_import_receipts where owner_id=p_owner_id and import_id=p_import_id) then
    return public.commit_roadmap_import_internal(p_owner_id,p_import_id,p_digest,p_package);
  end if;
  result := public.commit_roadmap_import_internal(p_owner_id,p_import_id,p_digest,p_package);
  for s in select value from jsonb_array_elements(p_package->'schedules') loop
    insert into public.roadmap_schedules(owner_id,roadmap_id,schedule_id,revision_id,package_json)
      values(p_owner_id,r,(s->>'scheduleId')::uuid,(s->>'revisionId')::uuid,s) on conflict do nothing;
    if not exists(select 1 from public.roadmap_schedules where owner_id=p_owner_id and roadmap_id=r and schedule_id=(s->>'scheduleId')::uuid and package_json=s) then raise exception 'Immutable schedule collision'; end if;
  end loop;
  for m in select value from jsonb_array_elements(p_package->'mappings') loop
    select d->>'carryover' into decision from jsonb_array_elements(p_decisions) d where d->>'mappingId'=m->>'mappingId';
    if decision is null then raise exception 'Choose carryover for every mapping'; end if;
    select case when count(*)=jsonb_array_length(m->'oldTaskIds') and bool_and(state='completed') then max(completed_at) end into completed
      from public.roadmap_task_progress where owner_id=p_owner_id and roadmap_id=r and task_id in (select value::uuid from jsonb_array_elements_text(m->'oldTaskIds'));
    select coalesce(string_agg(n.text,E'\n\n' order by ids.ordinality),'') into note from jsonb_array_elements_text(m->'oldTaskIds') with ordinality ids(id,ordinality)
      join public.roadmap_task_notes n on n.owner_id=p_owner_id and n.roadmap_id=r and n.task_id=ids.id::uuid where n.text<>'';
    for target in select value::uuid from jsonb_array_elements_text(m->'newTaskIds') loop
      if decision in ('completion','completion-and-notes') and completed is not null then insert into public.roadmap_task_progress(owner_id,roadmap_id,task_id,state,completed_at) values(p_owner_id,r,target,'completed',completed); end if;
      if decision in ('notes','completion-and-notes') and note<>'' then insert into public.roadmap_task_notes(owner_id,roadmap_id,task_id,text) values(p_owner_id,r,target,note); end if;
    end loop;
  end loop;
  return result;
end $$;

create table public.roadmap_restore_receipts (
  owner_id uuid not null references auth.users(id) on delete cascade, restore_id uuid not null,
  request jsonb not null, previous_backup jsonb not null, result jsonb not null,
  primary key(owner_id,restore_id)
);
alter table public.roadmap_restore_receipts enable row level security;
revoke all on public.roadmap_restore_receipts from anon,authenticated;
grant all on public.roadmap_restore_receipts to service_role;

create function public.restore_roadmap_account(p_owner uuid,p_restore_id uuid,p_backup jsonb,p_expected jsonb,p_mode text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare previous jsonb; receipt public.roadmap_restore_receipts; request jsonb; item jsonb; pkg jsonb; s jsonb; rec jsonb; d jsonb; r uuid; entity uuid; added integer := 0; result jsonb; old_rev bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text,0));
  request := jsonb_build_object('backup',p_backup,'expected',p_expected,'mode',p_mode);
  select * into receipt from public.roadmap_restore_receipts where owner_id=p_owner and restore_id=p_restore_id;
  if found then
    if receipt.request<>request then raise exception 'Restore ID reused'; end if;
    return receipt.result || jsonb_build_object('previousBackup',receipt.previous_backup);
  end if;
  previous := public.roadmap_account_backup(p_owner);
  if p_expected->>'sourceAccount' is distinct from p_owner::text or p_expected->'roadmaps' is distinct from previous->'roadmaps' then raise exception 'Account changed since restore preview; preview again'; end if;
  if p_mode not in ('merge','replace') or p_backup->>'format'<>'semassist-backup' or p_backup->>'version'<>'1' then raise exception 'Invalid restore'; end if;
  -- Replace checks the entire account before deleting anything; any failure rolls everything back.
  if p_mode='replace' then delete from public.roadmaps where owner_id=p_owner; end if;
  for item in select value from jsonb_array_elements(p_backup->'roadmaps') loop
    r := (item->>'roadmapId')::uuid;
    if p_mode='merge' and exists(select 1 from public.roadmaps where owner_id=p_owner and roadmap_id=r) then continue; end if;
    select value into pkg from jsonb_array_elements(item->'packages') where value #>> '{content,revisionId}'=item->>'activeRevisionId' limit 1;
    insert into public.roadmaps(owner_id,roadmap_id,title,subject,level,goals,active_revision_id,active_schedule_id,archived_at)
      values(p_owner,r,pkg #>> '{roadmap,title}',pkg #>> '{roadmap,subject}',pkg #>> '{roadmap,level}',pkg #> '{roadmap,goals}',(item->>'activeRevisionId')::uuid,(item->>'activeScheduleId')::uuid,(item->>'archivedAt')::timestamptz);
    for pkg in select value from jsonb_array_elements(item->'packages') loop
      insert into public.roadmap_revisions(owner_id,roadmap_id,revision_id,predecessor_revision_id,content,package_json,digest)
        values(p_owner,r,(pkg #>> '{content,revisionId}')::uuid,(pkg #>> '{content,predecessorRevisionId}')::uuid,pkg->'content',pkg,encode(sha256(convert_to(pkg::text,'UTF8')),'hex')) on conflict do nothing;
    end loop;
    for pkg in select value from jsonb_array_elements(item->'packages') loop
      for s in select value from jsonb_array_elements(pkg->'schedules') loop
        insert into public.roadmap_schedules(owner_id,roadmap_id,schedule_id,revision_id,package_json) values(p_owner,r,(s->>'scheduleId')::uuid,(s->>'revisionId')::uuid,s) on conflict do nothing;
      end loop;
    end loop;
    for s in select value from jsonb_array_elements(coalesce(item->'schedules','[]')) loop
      insert into public.roadmap_schedules(owner_id,roadmap_id,schedule_id,revision_id,package_json) values(p_owner,r,(s->>'scheduleId')::uuid,(s->>'revisionId')::uuid,s) on conflict do nothing;
    end loop;
    select coalesce((select (value->>'learnerRevision')::bigint from jsonb_array_elements(previous->'roadmaps') where value->>'roadmapId'=r::text),0) into old_rev;
    insert into public.roadmap_learner_state(owner_id,roadmap_id,revision) values(p_owner,r,greatest(old_rev,(item->>'learnerRevision')::bigint)+1);
    for rec in select value from jsonb_array_elements(item->'records') loop
      entity := (rec->>'entityId')::uuid; d := rec->'data';
      case rec->>'kind'
      when 'completion' then insert into public.roadmap_task_progress(owner_id,roadmap_id,task_id,state,completed_at) values(p_owner,r,entity,d->>'state',(d->>'completedAt')::timestamptz);
      when 'note' then insert into public.roadmap_task_notes(owner_id,roadmap_id,task_id,text) values(p_owner,r,entity,d->>'text');
      when 'mastery' then insert into public.roadmap_topic_mastery(owner_id,roadmap_id,topic_id,state,evidence) values(p_owner,r,entity,d->>'state',d->>'evidence');
      when 'milestone' then insert into public.roadmap_milestone_evidence(owner_id,roadmap_id,milestone_id,state,evidence) values(p_owner,r,entity,d->>'state',d->>'evidence');
      when 'study-time' then insert into public.roadmap_study_time(owner_id,roadmap_id,entry_id,task_id,minutes,recorded_at) values(p_owner,r,entity,(d->>'taskId')::uuid,(d->>'minutes')::integer,(d->>'recordedAt')::timestamptz);
      when 'assignment' then insert into public.roadmap_assignment_moves(owner_id,roadmap_id,assignment_id,schedule_id,date,override_reason) values(p_owner,r,entity,(d->>'scheduleId')::uuid,(d->>'date')::date,d->>'overrideReason');
      else raise exception 'Unknown learner record'; end case;
    end loop;
    -- Restored records receive fresh revisions; old device baselines cannot overwrite them silently.
    delete from public.roadmap_import_receipts where owner_id=p_owner and roadmap_id=r;
    added := added+1;
  end loop;
  result := jsonb_build_object('restored',added,'mode',p_mode);
  insert into public.roadmap_restore_receipts values(p_owner,p_restore_id,request,previous,result);
  return result || jsonb_build_object('previousBackup',previous);
end $$;

create function public.manage_roadmap(p_owner uuid,p_roadmap uuid,p_action text,p_expected jsonb,p_schedule uuid default null) returns void
language plpgsql security definer set search_path='' as $$
declare item public.roadmaps; revision bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text,0));
  select * into item from public.roadmaps where owner_id=p_owner and roadmap_id=p_roadmap for update;
  if not found then raise exception 'Roadmap not found'; end if;
  if p_action='activate' then
    select coalesce((select s.revision from public.roadmap_learner_state s where s.owner_id=p_owner and s.roadmap_id=p_roadmap),0) into revision;
    if p_expected->>'revisionId' is distinct from item.active_revision_id::text or p_expected->>'scheduleId' is distinct from item.active_schedule_id::text or (p_expected->>'learnerRevision')::bigint is distinct from revision then raise exception 'Schedule or progress changed; preview again'; end if;
    if not exists(select 1 from public.roadmap_schedules where owner_id=p_owner and roadmap_id=p_roadmap and schedule_id=p_schedule and revision_id=item.active_revision_id) then raise exception 'Schedule does not match active revision'; end if;
    update public.roadmaps set active_schedule_id=p_schedule,updated_at=now() where owner_id=p_owner and roadmap_id=p_roadmap;
  elsif p_action='delete' then delete from public.roadmaps where owner_id=p_owner and roadmap_id=p_roadmap;
  elsif p_action in ('archive','unarchive') then update public.roadmaps set archived_at=case when p_action='archive' then now() else null end,updated_at=now() where owner_id=p_owner and roadmap_id=p_roadmap;
  else raise exception 'Unknown roadmap action'; end if;
end $$;

revoke all on function public.roadmap_account_backup(uuid), public.commit_roadmap_mutation(uuid,jsonb), public.commit_roadmap_import(uuid,uuid,text,jsonb,jsonb), public.restore_roadmap_account(uuid,uuid,jsonb,jsonb,text), public.manage_roadmap(uuid,uuid,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.roadmap_account_backup(uuid), public.commit_roadmap_mutation(uuid,jsonb), public.commit_roadmap_import(uuid,uuid,text,jsonb,jsonb), public.restore_roadmap_account(uuid,uuid,jsonb,jsonb,text), public.manage_roadmap(uuid,uuid,text,jsonb,uuid) to service_role;
