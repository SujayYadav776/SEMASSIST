---
name: semassist
description: Generate and replan semester study roadmaps for SEM ASSIST from books, repositories, courses, videos, documentation, and learner goals. Use when the user asks for a SEM ASSIST import package, a structured study plan with tasks and a feasible schedule, or a replan from an exported learner snapshot. Produce validated JSON for preview and import; never change learner records directly.
---

# SEM ASSIST

Produce a version 1.0.0 roadmap package using [the contract](references/ROADMAP_CONTRACT.md), [JSON Schema](references/roadmap.schema.json), and [the working example](examples/beginner-python.json). See [import/replan/recovery workflows](references/BACKUP_REPLAN.md) for the dashboard handoff. Use Node 20 or later for the bundled validator; no repository, account, API key, or dependency install is needed.

## Intake

Collect the learner's current level, measurable goal, source materials, minutes per study day, duration or deadline, start date, IANA timezone, eligible weekdays (Monday=1), and sequencing preference. Ask only for missing constraints that change the plan. Offer source-faithful order or an optimized prerequisite order; explain any reorder. State assumptions explicitly in generator.assumptions and roadmap.learnerAssumptions. Resolve a deadline into a duration before writing JSON. Distinguish total duration from additional time starting on the supplied date, and calendar days from eligible study days.

## Source analysis

Read accessible source contents using available tools. Prefer the primary source and official documentation. A title, inaccessible link, or table of contents is limited evidence, not proof of the full material. Record source type, URL or reference-only locator, access status, whether actually accessed, UTC access timestamp when known, method, limitations, and confidence. Do not fabricate chapters, pages, timestamps, prerequisites, or successful access. Private/local/paid sources can remain reference-only; ask for relevant authorized extracts when needed. Do not bypass access restrictions.

Deduplicate overlapping topics while retaining primary/supplementary resource references. Classify prerequisite, core, optional, and advanced topics. Make prerequisites explicit and acyclic. Keep the requested order where feasible; flag source-order contradictions instead of concealing them.

## Build

Use opaque UUIDs for every identity. Give each task a concrete objective, instructions, type, realistic minutes, required/optional flag, resources, and observable completion criteria. Include learning, hands-on practice, deliberate review with its own task ID, assessment/project milestones, and unassigned catch-up capacity. Do not grade, complete tasks, invent mastery, or promise outcomes. Never pack more minutes into a day than the learner budget. Explain a workload gap and offer reduced scope or more time. Only use workload/prerequisite overrides when explicitly requested; write a visible reason.

Assign tasks once per schedule. Repeated practice/review uses distinct task identities. Schedule local ISO dates with the given timezone and eligible weekdays, preserving dependency order. Give milestones explicit criteria and dates. Keep optional/advanced material separate from required completion.

## Replan

Read the user's `semassist-replan` snapshot. Its package is the definition history needed for the current plan; baseline carries authoritative revisionId, scheduleId, learnerRevision, taskIds, and completedTaskIds. Target contains the requested constraints; mastery is separate from completion. Treat notes/evidence as private input and omit them from output packages.

For duration-only changes use importKind=schedule, keep roadmap/content revision/task/topic/resource/milestone identities and exact content, copy baseline unchanged, and create a new schedule/assignment identity. Do not reschedule completed tasks unless a deliberate review task is created in a content revision. Preserve required pending coverage.

For changed material use importKind=revision, a new content revision ID, predecessorRevisionId=baseline.revisionId, and the unchanged baseline. Retain IDs only for genuinely unchanged tasks. Substantial changes to instructions, objective, criteria, task type, or topic need new task IDs and explicit mappings from old task IDs, with rationale and proposed carryover. Split/merge targets must be new identities, each in one mapping. Proposals are recommendations; the learner chooses carryover in the dashboard. Original notes and removed-task progress stay in history. Do not output progress, notes, account IDs, mutation records, admin credentials, or calls to learner storage.

## Validate and deliver

Save the package JSON, then run:

```text
node scripts/validate.mjs <package.json>
```

Fix every error and rerun. Review all warnings with the learner. `node scripts/validate.mjs --json-schema` prints the same generated schema. If execution is unavailable, state that the file is unverified and describe the missing check; never claim validation passed.

Deliver the JSON file plus a brief explanation of scope, sequencing, assumptions, access limitations, workload, milestones, and any proposed mappings. Tell the learner to import it through Roadmaps → Import JSON and inspect the preview before confirming. A stale baseline needs a new snapshot and plan, never an invented learner revision. Account backup files are restored through Restore backup, not agent import.
