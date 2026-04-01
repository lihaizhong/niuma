# Implementation Tasks

## Phase 1: Red (Write Tests)

{{#tasks.red}}

### {{number}}. {{title}}

- [ ] {{action}}
- **Verifiable by:** Test fails
  {{/tasks.red}}

## Phase 2: Green (Make Tests Pass)

{{#tasks.green}}

### {{number}}. {{title}}

- [ ] {{action}}
- **Verifiable by:** Test passes
  {{/tasks.green}}

## Phase 3: Refactor (Improve Code)

{{#tasks.refactor}}

### {{number}}. {{title}}

- [ ] {{action}}
- **Verifiable by:** Tests still pass, code improved
  {{/tasks.refactor}}

## Verification Checklist

- [ ] All tests pass (`pnpm test:unit`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Type check passes (`pnpm type-check`)
- [ ] Format check passes (`pnpm format-check`)

---

_Tasks organized using TDD Red-Green-Refactor cycle_
