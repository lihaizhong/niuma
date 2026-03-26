---
target: AI Assistant
purpose: Operational guidelines for Niuma project
version: 1.0
---

# AI Agent Guidelines - Niuma Project

## Context

Niuma (牛马) - Multi-agent AI assistant system. TypeScript + Node.js + Next.js.

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
2. Create tests in `niuma/tests/` or `src/tests/`
3. Run `pnpm test:unit` to confirm tests fail (Red)
4. Commit tests

Test coverage:

- Normal cases
- Edge cases
- Error handling

### Developer

Implement code to pass tests.

Workflow:

1. Read spec.md and existing tests
2. Implement in `niuma/` or `src/`
3. Run tests until pass (Green)
4. Refactor (Refactor)

Standards:

- Pass `pnpm lint`
- Pass `pnpm type-check`
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

| Phase    | Command                | Purpose              |
| -------- | ---------------------- | -------------------- |
| Explore  | `/opsx-explore`        | Clarify requirements |
| Propose  | `/opsx-propose <name>` | Create specification |
| Apply    | `/opsx-apply`          | TDD implementation   |
| Validate | pre-commit hook        | Machine acceptance   |
| Archive  | post-merge             | Archive change       |

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

See detailed specs in [openspec/config.yaml](./openspec/config.yaml)

## Directory Structure

```
niuma/         # Agent core (TypeScript)
src/           # Web service (Next.js)
openspec/      # Workflow config and active changes
```

See [README](./README.md) for full structure.

## Pre-Commit Gates

Commands that MUST pass before commit:

```bash
pnpm lint              # ESLint
pnpm type-check        # TypeScript
pnpm test:unit         # Unit tests
pnpm test:integration  # Integration tests
pnpm format:check      # Formatting
openspec validate      # If active changes exist
```

Failure blocks commit.

## Commit Format

Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:

- `feat:` - New feature
- `fix:` - Bug fix
- `test:` - Tests
- `docs:` - Documentation
- `refactor:` - Code change
- `chore:` - Maintenance

Example:

```
feat(agent): add memory management

- Implement short-term memory
- Add long-term consolidation

Closes #123
```

## Constraints

SHALL:

- Use TDD (Red→Green→Refactor)
- Write tests before implementation
- Follow directory conventions
- Use English identifiers
- Run all gates before commit

SHALL NOT:

- Skip tests
- Commit failing checks
- Push to main directly
- Ignore type errors
- Leave TODOs unresolved

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
