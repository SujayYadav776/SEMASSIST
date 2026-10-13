# Independent SEM ASSIST skill

Run `npm run skill:build`. The complete distributable is
`dist/skills/semassist/`: SKILL.md, generated JSON Schema, contract reference,
working examples, dependency license, and a bundled Node validator. Copy that
folder into the agent's skills directory (for Codex, `~/.codex/skills/semassist`).
Keep the entire folder together; the source SKILL.md alone lacks generated files.
Node 20+ is required only for validation, with no dependency install.

The skill reads accessible material and learner constraints, reports limitations,
generates initial/replanning packages, validates them, and hands JSON back for
dashboard preview. It has no credentials and never writes learner storage.
Rebuild after contract changes; the package uses the canonical shared validator.
