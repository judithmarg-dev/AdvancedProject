---
name: sdd-validate-impl
description: >
  Spec Driven Development workflow step that runs ONLY after sdd-implement and BEFORE
  sdd-verify (sdd-spec > sdd-clarify > sdd-plan > sdd-implement > sdd-validate-impl >
  sdd-verify). Applies only when the implementation created or changed a server behavior
  (server room/message handler/token endpoint) or a client change (scene, UI, networking); otherwise it is skipped and the flow
  goes straight to sdd-verify. Asks the developer to manually validate the feature, then
  routes the workflow: back to sdd-implement if the developer requests changes or reports
  problems, forward to sdd-verify if the developer approves. Never marks a spec "Implemented".
---

# SDD: Validate Implementation (manual gate)

Position in the workflow:

```
sdd-spec > sdd-clarify > sdd-plan > sdd-implement > [sdd-validate-impl] > sdd-verify
                                          ^                  |
                                          └── change request ┘
```

Only invoke this skill as the step after `sdd-implement` and before `sdd-verify`. Do not use
it standalone or at any other point of the workflow.

## Spec layout assumed

```
specs/README.md                  # index: one row per spec with its status
specs/NNN-name/spec.md           # context, AC-n criteria, traceability, Validation log, status
specs/NNN-name/plan.md           # approach by layer (shared, server, client)
specs/NNN-name/tasks.md          # checklist: - [ ] / - [x] T-n ...
```

## Workflow

### 1. Locate the spec
Use the spec being implemented (named by the user or the workflow, else the one `In progress` in `specs/README.md`). Read `spec.md`, `plan.md`, `tasks.md`.

### 2. Decide: validate or skip
Decide from the spec files (`tasks.md`, `plan.md`, `spec.md`), not from the git diff.
Validation is **required** only if the work includes either:
- a **new or modified server behavior** a user can notice: `OfficeRoom` message handlers or schema, the LiveKit token endpoint, join/leave logic; or
- a **client change** in `client/` (3D scene, avatar, camera, UI panel, networking, audio/video, assets).

Otherwise (e.g. docs, config, CI, scripts, types-only changes in `shared/`, refactors with no visible effect) **skip**:
1. Tell the user it is skipped and why (no user-visible server or client change).
2. Append to `spec.md` `## Validation log`: `<date> – Skipped: no user-visible server or client change.`
3. Pass to `sdd-verify`.

### 3. Hand the developer a manual validation checklist
Derive it from the spec; do not invent behavior. Present it to the user and add it to
`spec.md` under `## Validation log`:

| Ref | Scenario (steps) | Expected result | Result (✅/❌/n.a.) | Notes |
|---|---|---|---|---|

Cover, per `AC-n`, only what the changed server behavior / client screens affect:
1. **Goal** – the happy path achieves the stated goal.
2. **Side effects** – earlier phases still work (movement, collisions, other players, chat), frame rate stays ~60 fps.
3. **Errors** – empty name, server down or restarted, tab closed mid-session, mic/camera permission denied, LiveKit unreachable.
4. **Different views** – two or more browser tabs/users, different window sizes, a second browser.

State how to run the app (`npm run dev`, and the second tab URL; the `run` skill can launch it). Then **stop and wait**
for the developer's response. Do not proceed on assumptions.

### 4. Route on the developer's response

**A. The developer reports a problem or requests a change** → record it and return to `sdd-implement`:
1. Log the findings in `## Validation log` (date, what was tried, result per row).
2. Update the files so they stay in sync (show the proposed edits and apply once the developer agrees):
   - bug / AC not achieved / regression: add or reopen a task in `tasks.md` (`- [ ] T-n Fix: ...`, linked to its `AC-n`), reopening any wrongly closed `[x]`;
   - requirement changed or dropped: edit the `AC-n` in `spec.md`, then `plan.md` and `tasks.md` to match;
   - task replaced or removed: replace it in `tasks.md` and the matching `plan.md` group; keep IDs stable and mark old ones `~~T-n~~ (replaced by T-m)`.
3. Every `AC-n` must still map to at least one task. Surface any AC wording change explicitly.
4. Keep the spec status **`In progress`**.
5. Hand off: tell the user to continue with `sdd-implement` for the open tasks. After it
   finishes, this skill runs again (repeat from step 2).

**B. The developer approves the manual verification** (ask explicitly if unclear:
"Do you approve this implementation: goal achieved, no side effects, no open errors?") →
1. Add to `## Validation log`: `Approved by <developer>, <date>`.
2. Keep the status `In progress`.
3. Pass to `sdd-verify`.

## Don'ts
- Don't run outside the `sdd-implement` → `sdd-verify` slot, or when validation should be skipped.
- Don't set status to `Implemented` or edit the status in `specs/README.md`; that is `sdd-verify`.
- Don't mark validation rows or approve on the developer's behalf.
- Don't silently change AC-n text.
- Don't implement fixes here; send the work back to `sdd-implement`.
