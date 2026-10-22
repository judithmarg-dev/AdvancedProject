---
name: sdd-clarify
description: Reviews a spec in Draft for the 3D virtual office, finds ambiguities, gaps and contradictions, asks the user concrete questions (at most 5) and records the answers in the spec. Use after /sdd-spec and before approving a spec, or when a spec has open questions.
---

# Phase 2 · Clarify

The goal is for the spec to reach `Approved` without ambiguities that would force inventing behavior during implementation.

## Steps

1. **Read** the spec, `PLAN.md` (stack, out of scope), `CLAUDE.md` and the related specs.
2. **Look for problems** in this order:
   - Unanswered open questions.
   - Unverifiable criteria ("smooth", "fast", "close").
   - Undefined error and edge cases: server unreachable, duplicate or empty name, user leaves mid-message, mic/camera permission denied, LiveKit token failure.
   - Limits without a number: update rate (Hz), hearing distance (m), speed, room bounds, max users, text length, chat history size.
   - Who owns what: which state is server-authoritative and which is client-only (Constitution II).
   - Behavior on join/leave/reconnect.
   - Terms used with different meanings (player, user, participant, avatar).
   - Contradictions with existing specs or with "Fuera de alcance del MVP".
3. **Ask the user** at most 5 things at a time, most important first. Each question is concrete, answerable in one line, and offers 2 or 3 options with your recommendation marked.
4. **Record each answer** in *Clarificaciones* (`- 2026-10-21 · Question? → Answer`) and reflect it where it belongs: a new or corrected `AC-n`, a business rule or an out-of-scope item.
5. When no ambiguities remain, suggest moving the spec to `Approved`. Only the human approves it.

## Don't

- Don't answer the business questions yourself, even if it seems obvious.
- Don't add technical details to the spec (components, libraries, schema fields).
- Don't ask more than 5 questions per round; do another round instead.
