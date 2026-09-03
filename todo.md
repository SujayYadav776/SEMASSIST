# Dashboard Revision Tasks

- [x] Add a Personal Tasks section with a task title input and Today / This week cadence selector.
- [x] Let custom tasks be checked off, deleted, and persisted locally alongside roadmap progress.
- [x] Include custom-task completions in progress totals, proof points, streaks, and the activity calendar.
- [x] Preserve existing roadmap progress when loading older local storage data.
- [x] Verify custom task creation, completion, deletion, persistence, and mobile layout in the browser.

- [x] Translate the supplied reference into a dashboard-specific visual specification: pearl-gray canvas, cream/yellow glow, compact pill navigation, modular cards, and restrained black typography.
- [x] Replace the existing Mission Control layout with the reference-inspired dashboard composition while retaining checklists, filters, roadmap links, and progress calculations.
- [x] Rebuild the activity calendar, telemetry, and roadmap checkpoint areas using the new card hierarchy and proportions.
- [x] Adapt the new visual system for mobile without reducing tracking usability.
- [x] Verify reference fidelity and persistent task/calendar interactions at desktop and mobile sizes.

## Redesign verification note

The redesigned dashboard was visually checked at desktop and phone widths. The pearl-gray canvas, cream/yellow dashboard glow, pill navigation, modular soft cards, compact type hierarchy, segmented progress, and rounded inset task panel all render as intended. A completed Python checkpoint was migrated from the prior interface, then a second checkpoint was checked successfully: the dashboard updated to `2 / 46`, Python updated to `2 / 12`, the activity calendar reported two completions on one day, proof points increased to `20`, and progress remained locally persisted.

- [x] Review the supplied roadmap.sh Python path and extract its major learning checkpoints.
- [x] Review the supplied roadmap.sh Java path and extract its major learning checkpoints.
- [x] Replace the existing Python and Java task lists with roadmap-aligned milestones while preserving the semester focus.
- [x] Add a GitHub-style completion calendar whose daily intensity reflects task completions.
- [x] Preserve roadmap progress and dated activity in local browser storage, including export/reset behavior.
- [x] Verify desktop and mobile rendering, task interactions, progress math, and calendar updates.

## Verification note

The first Python roadmap checkpoint was checked in a browser. The dashboard then updated from `0 / 46` to `1 / 46`, recorded a one-day streak, raised the Python track to `1 / 12`, displayed one active day and one task completion in the activity summary, and showed the persistence confirmation. Desktop and mobile visual checks confirmed that the redesigned command desk, orbit meters, calendar, semantic subject rails, roadmap checkpoint cards, and long evidence trail remain readable.

## Custom-task verification note

The updated dashboard passed TypeScript and standalone JavaScript syntax checks. In the browser, a daily custom task was added, appeared in the list, increased the total from `46` to `47`, and was then checked off to update proof points, streak, and activity totals. A weekly custom task was also added and displayed the `This week` cadence label, then removed. The temporary test tasks were cleaned up. Phone-width screenshots confirmed the custom form and task list remain readable in the responsive layout. A final reload of the active dashboard restored a temporary custom task with its `Today` cadence, confirming localStorage persistence across reopening.

- [ ] Add inline editing for custom task titles and cadence.
- [ ] Add specific due dates to custom tasks and persist them locally.
- [ ] Add overdue highlighting for incomplete tasks past their due date.
- [ ] Verify editing, due-date persistence, overdue states, and responsive layout.
