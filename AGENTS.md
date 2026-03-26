---
target: AI Assistant
purpose: Operational guidelines for Niuma project
version: 1.0
---

# AI Agent Guidelines - Niuma Project

## Context

Niuma (牛马) - Enterprise multi-agent AI assistant system. TypeScript + Node.js + Next.js.

## Roles

### SpecWriter

Create OpenSpec artifacts for new features.

Artifacts to create:

- `openspec/changes/<name>/proposal.md`
- `openspec/changes/<name>/specs/*/spec.md`
- `openspec/changes/<name>/specs/*/test.md`
- `openspec/changes/<name>/tasks.md`

Requirements:

- Use SHALL/MUST keywords in specs
- Include WHEN/THEN scenarios
- Define acceptance criteria

### Tester

Implement tests before code exists.

Workflow:

1. Read spec.md and test.md
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

## Directory Structure

```
niuma/                    # Agent core
├── core/                # agent.ts, tool.ts, memory.ts, types.ts
├── tools/               # Tool implementations
├── agents/              # Agent definitions
├── skills/              # Skill definitions
├── memory/              # Memory storage
└── tests/               # Unit tests

src/                     # Web service
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                 # Utilities
└── tests/               # Integration tests

openspec/                # OpenSpec workflow
├── config.yaml          # Workflow config
└── changes/<name>/      # Active changes
    ├── proposal.md
    ├── design.md
    ├── specs/
    └── tasks.md
```

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
