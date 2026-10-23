---
name: sdd-implement
description: Implements the tasks in a spec's tasks.md for the 3D virtual office in order, test first, checking off each task when done. Use when a feature's plan is approved, or when sdd-validate-impl sends the work back with change requests.
---

# Phase 4 · Implement

## Before starting

- The spec must be `In progress` and have `plan.md` and `tasks.md`.
- Run the tests to confirm you start from green:
  ```bash
  npm test
  npm run build
  ```
  (Before spec 001 delivers the scripts, skip what does not exist yet and say so.)

## Cycle per task

1. Take the first unchecked task in `tasks.md`.
2. If the task calls for a test: write it, run it and **confirm it fails for the right reason**.
3. Implement the minimum to make it pass. Follow the constitution in `CLAUDE.md`.
4. Run the suite for the affected workspace. Everything green before moving on.
5. Check off the task `[x]` in `tasks.md`.
6. Suggest a commit: `feat(NNN): T3 short description`.

## If the spec falls short

If you discover a case the spec does not define (an error, a limit, a rule):

1. **Stop.** Don't invent the behavior.
2. Explain the case to the user and propose the new criterion.
3. Once approved, add it to the spec as an `AC-n` and a task in `tasks.md`.

## Coming back from sdd-validate-impl

Open tasks `Fix: ...` or edited tasks are the work. Same cycle: failing test first when the failure can be automated (otherwise describe the manual check), then fix. When all are `[x]`, hand off to `/sdd-validate-impl` again.

## Quick conventions

- TypeScript strict; network types only in `shared/`.
- Server is authoritative; client sends intent/position only.
- R3F: per-frame logic in `useFrame`, no React state updates per frame; shared state in zustand.
- Secrets in `.env` only; keep `.env.example` current.

## Don't

- Don't skip tasks or reorder them without saying so.
- Don't check off a task whose tests do not pass.
- Don't touch other specs except as declared in *Impacto en specs existentes*.
- Don't add dependencies that the plan did not record.
