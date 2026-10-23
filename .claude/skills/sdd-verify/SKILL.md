---
name: sdd-verify
description: Verifies that a feature of the 3D virtual office meets its spec - every AC-n criterion has a test or a recorded manual validation, the build and tests pass and the code does no more and no less than specified. Completes the traceability and closes the spec. Use after sdd-implement / sdd-validate-impl or to audit an existing spec.
---

# Phase 5 · Verify

## Steps

1. **Run everything:**
   ```bash
   npm run build
   npm test
   ```
   If something fails, stop and report it. Don't keep verifying on a broken build.
2. **Review `tasks.md`:** every task must be `[x]`.
3. **Check the validation gate:** if the spec touched the client, scene, UI or network flow, `## Validation log` must contain `Approved by ..., <date>`. If missing, stop and send the user to `/sdd-validate-impl`.
4. **Build the traceability matrix** in *Trazabilidad* of `spec.md`: for each `AC-n`, the test(s) (file and name) or the manual validation rows that cover it. A criterion without either is a **gap**.
5. **Look for drift between spec and code:**
   - Behavior implemented that the spec does not mention.
   - Spec criteria the code does not fully meet.
   - Authoritative logic living in the client instead of `server/`; network types defined outside `shared/`.
6. **Review the impact:** if the spec declared changes to other specs, confirm they were updated.
7. **Review the constitution:** confirm the *Verificación de constitución* in `plan.md` still holds.
8. **Go through the definition of done** in `CLAUDE.md` item by item, including the phase's "Hecho cuando" in `PLAN.md`.
9. **Report** to the user:

   ```
   Spec NNN · <name>
   Build and tests: OK / FAIL (details)
   Tasks: n/n
   Manual validation: approved / skipped (reason) / missing
   Criteria covered: n/n  (gaps: AC-x ...)
   Drift: none / list
   Constitution: OK / articles with issues
   Definition of done: n/n
   ```

10. If there are no gaps or drift and the definition of done is met: set the spec status to `Implemented`, update `specs/README.md`, then update `PLAN.md` ("Estado actual", phase checkboxes, "Decisiones").
