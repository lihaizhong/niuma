---
target: AI Assistant
purpose: Operational guidelines for PROJECT_NAME project
version: 1.0
---

# AI Agent Guidelines - PROJECT_NAME Project

## Context

PROJECT_NAME - PROJECT_DESCRIPTION

See [openspec/config.yaml](./openspec/config.yaml) for detailed project configuration.

## Roles

### SpecWriter

Create OpenSpec artifacts for new features.

Artifacts to create:

- `openspec/changes/<name>/proposal.md` — why we're doing this, what's changing
- `openspec/changes/<name>/design.md` — technical approach
- `openspec/changes/<name>/specs/*.md` — requirements and scenarios
- `openspec/changes/<name>/tasks.md` — implementation checklist

Requirements:

- Use SHALL/MUST keywords in specs
- Include WHEN/THEN scenarios
- Define acceptance criteria

### Tester

Implement tests before code exists.

Workflow:

1. Read specs from `openspec/changes/<name>/specs/*.md`
2. Create tests in `TEST_DIR/`
3. Run `PACKAGE_MANAGER test:unit` to confirm tests fail (Red)
4. Commit tests

Test coverage:

- Normal cases
- Edge cases
- Error handling

### Developer

Implement code to pass tests.

Workflow:

1. Read spec.md and existing tests
2. Implement in `SRC_DIR/`
3. Run tests until pass (Green)
4. Refactor (Refactor)

Standards:

- Pass `PACKAGE_MANAGER lint`
- Pass `PACKAGE_MANAGER type-check`
- Maintain coverage

### Reviewer

Validate code quality.

Checklist:

- [ ] TypeScript strict mode
- [ ] All tests pass
- [ ] No ESLint warnings
- [ ] Formatted code
- [ ] Updated docs

## Workflow Commands

| Phase    | Command                | Purpose                  | Trigger                  |
| -------- | ---------------------- | ------------------------ | ------------------------ |
| Explore  | `/opsx-explore`        | Clarify requirements     | Manual                   |
| Propose  | `/opsx-propose <name>` | Create specification     | Manual                   |
| Spike    | `/opsx-spike <name>`   | Technical research       | Manual                   |
| Bugfix   | `/opsx-bugfix <id>`    | Fix bugs                 | Manual                   |
| Apply    | `/opsx-apply`          | TDD implementation       | Manual                   |
| Validate | pre-commit hook        | Machine acceptance       | Auto (git hook)          |
| Archive  | GitHub Actions         | Archive completed change | Auto (on release/deploy) |

Full workflow config: [openspec/config.yaml](./openspec/config.yaml)

## TDD Cycle

```
Write Test → Red (Fail) → Implement → Green (Pass) → Refactor → Repeat
```

Phases:

- **Red**: Write tests that fail
- **Green**: Write minimal code to pass
- **Refactor**: Improve without changing behavior

## OpenSpec + TDD Integration

### Workflow

```
OpenSpec Phase          TDD Cycle
────────────────        ─────────
specs/*.md              → Red: from scenarios write tests
  └─ WHEN/THEN          → Green: implement code
tasks.md                → Refactor: refactor code
  └─ [Red] Write tests       ← each scenario maps to one test
  └─ [Green] Implement       ← make tests pass
  └─ [Refactor] Refactor    ← refactor
```

### Schema-Specific Workflows

| Schema      | Input Artifacts                              | Output Artifacts                    | No Code Production |
| ----------- | -------------------------------------------- | ----------------------------------- | ------------------ |
| spec-driven | proposal, design, specs, tasks               | Implementation + tests              | No                 |
| bugfix      | bug-report, fix                              | Fix + regression tests              | No                 |
| spike       | research-question, exploration-log, decision | Research findings + decision record | Yes (throwaway)    |

## Constraints

SHALL:

- Use TDD (Red→Green→Refactor)
- Write tests before implementation
- Follow directory conventions
- Use English identifiers
- Run all gates before commit
- Use `spec-driven` schema for new features and enhancements
- Use `bugfix` schema for bug fixes and hotfixes
- Use `spike` schema for technical research and feasibility studies

SHALL NOT:

- Skip tests
- Commit failing checks
- Push to main directly
- Ignore type errors
- Leave TODOs unresolved
- Mix feature work with bugfix in the same change
- Mix research/spike work with implementation in the same change

## Communication

With users:

- Clarify requirements first
- Report progress regularly
- Propose options for problems
- Document decisions

In commits:

- One logical change per commit
- Clear commit messages
- Reference issues when applicable

## Resources

- [OpenSpec Config](./openspec/config.yaml)
- [README](./README.md)
