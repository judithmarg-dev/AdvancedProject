---
name: sdd-spec
description: Creates or updates the spec (spec.md) for a feature of the 3D virtual office from an idea, a PLAN.md phase or a change request. Use when the user asks for a new feature, a behavior change or "write the spec for X". Does not write code or technical plans. First step of the SDD flow in CLAUDE.md.
---

# Phase 1 · Specify

You produce `specs/NNN-short-name/spec.md`. The spec describes **what** and **why**, never **how**.

## Steps

1. **Read the context before writing.**
   - `CLAUDE.md` (flow and constitution), `specs/README.md` (table of specs) and `PLAN.md` (phase goals, "Hecho cuando", out of scope).
   - If the idea is listed under "Fuera de alcance del MVP", say so before writing.
   - Existing specs that touch the same area (movement, rooms, chat, audio). Look for rules the new feature might change.
2. **Choose the number and folder.** Next free 3-digit number and a short hyphenated English name: `specs/002-local-scene/`. A PLAN.md phase maps to one spec; use its "Hecho cuando" as the seed for the criteria.
3. **Copy `specs/_templates/spec.md`** and fill it in (Spanish):
   - Context in 2 or 3 business sentences.
   - User stories with a real role (`participante`, `visitante`).
   - `AC-n` criteria in *Dado / cuando / entonces* form, each observable in the UI, the network messages or the console.
   - Business rules: numbers (update rate in Hz, hearing distance in meters, max text length), join/leave behavior.
   - Out of scope: at least one item.
   - Impact on existing specs: name the spec and the criterion, or "Ninguno".
4. **List the open questions** instead of inventing answers.
5. **Leave the status as `Draft`**, add the row to `specs/README.md` and suggest continuing with `/sdd-clarify`.

## Checklist before delivering

- [ ] No criterion mentions classes, libraries, file names or component names.
- [ ] Each criterion is verifiable with a test or, for 3D/audio/video, a described manual scenario.
- [ ] Edge cases are covered: user leaves, server down, two users at once, microphone denied, empty name.
- [ ] No contradiction with an existing spec without declaring it.

## Change requests

If called from `sdd-validate-impl` or by the user to change an approved spec: edit the affected `AC-n` showing the diff, keep IDs stable, move the status back to `Draft` only if scope grows; otherwise keep it and tell the user which tasks must be reopened.

## Don't

- Don't create `plan.md` or `tasks.md`: that is `/sdd-plan`.
- Don't mark the spec as `Approved`: only the human does it, after `/sdd-clarify`.
