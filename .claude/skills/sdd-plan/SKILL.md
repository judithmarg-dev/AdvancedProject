---
name: sdd-plan
description: Generates plan.md and tasks.md for an approved spec of the 3D virtual office, with changes by layer (shared, server, client), network contracts and test strategy. Use when a spec is in Approved status and you need to decide how to implement it.
---

# Phase 3 · Plan

You produce `plan.md` and `tasks.md` inside the spec's folder.

## Before starting

- The spec must be `Approved`. If it is `Draft`, stop and ask for approval.
- If the spec has unresolved open questions, stop and ask them.

## Steps

1. **Read** the full spec, `CLAUDE.md` (constitution, testing), `PLAN.md` (stack table, decisions) and the code of the layers you will touch. Look for reusable pieces first.
2. **Copy `specs/_templates/plan.md`** and decide, layer by layer:
   - **shared:** new/changed types, message names, constants (update rate, distances). All network types live here.
   - **server:** `OfficeRoom` schema changes, message handlers, validation, LiveKit token endpoint. State stays authoritative.
   - **client:** `scene/` (R3F components), `net/` (Colyseus client), `store/` (zustand), `ui/` (React panels), assets in `public/models/`.
3. **Complete the constitution check** (articles I–VII of `CLAUDE.md`). If one is not met, justify it and stop until the user approves the exception.
4. **Record decisions** with discarded alternatives. A new dependency goes in `PLAN.md` > Decisiones and in `plan.md`; stack choices already closed in `PLAN.md` are not reopened.
5. **Test strategy** (per `CLAUDE.md` > Pruebas): every `AC-n` appears with its type (unit / integration / manual) and file. Manual means it will be covered in `sdd-validate-impl`; say why it cannot be automated.
6. **Copy `specs/_templates/tasks.md`** and write tasks:
   - Inside out: shared → server → client.
   - Each task names the criteria it advances: `T3 · (AC-2, AC-4) ...`.
   - First the failing test, then the implementation.
   - Last task: traceability and `/sdd-verify`.
7. **Change the spec status to `In progress`** only when the user approves the plan.

## Don't

- Don't write production code in this phase.
- Don't put logic that must be authoritative (positions accepted, chat rules, token issuance) in the client.
- Don't add dependencies without recording the decision.
