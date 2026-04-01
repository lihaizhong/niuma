---
name: openspec-bugfix
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: niuma
  version: "1.0"
---

Implement bug fixes using the bugfix schema workflow.

**Trigger**: Use when the user reports a bug, error, or issue that needs fixing. Keywords: "bug", "error", "broken", "not working", "crash", "fix", "issue".

**Input**: Optionally specify a bug ID (e.g., "login-button-error"). If omitted, generate one from the symptom description.

**Steps**

1. **Create the bugfix change**

   ```bash
   openspec new bugfix "<bug-id>"
   ```

   This creates `openspec/bugs/<bug-id>/` with `.openspec.yaml` configured for the bugfix schema.

2. **Check status and get instructions**

   ```bash
   openspec status --bugfix "<bug-id>" --json
   ```

   Parse the JSON to understand:
   - `schemaName`: Should be "bugfix"
   - `artifacts`: List of required artifacts and their status
   - `applyRequires`: Artifacts needed before implementation (typically ["bug-report", "fix"])

3. **Create bug-report.md artifact**

   Get instructions:

   ```bash
   openspec instructions bug-report --bugfix "<bug-id>" --json
   ```

   Create the artifact with these sections:
   - **Symptom**: Clear description of what's wrong
   - **Steps_to_Reproduce**: Numbered steps to trigger the bug
   - **Expected_Behavior**: What should happen
   - **Actual_Behavior**: What actually happens
   - **Environment**: OS, browser, version info
   - **Root_Cause_Analysis** (optional): Initial hypothesis
   - **Workaround** (optional): Any known temporary fix

4. **Reproduce and verify**

   Based on the bug report:
   - Attempt to reproduce the bug locally
   - If cannot reproduce, ask user for clarification
   - Document any additional reproduction details discovered

5. **Create fix.md artifact**

   Get instructions:

   ```bash
   openspec instructions fix --bugfix "<bug-id>" --json
   ```

   Document:
   - **Root_Cause**: The actual root cause found during investigation
   - **Fix_Description**: What was changed and why
   - **Files_Changed**: List of modified files
   - **Testing_Strategy**: How the fix was tested
   - **Spec_Impact** (optional): If this bug reveals a spec error, document:
     - **Affected_Spec**: Path to the spec file (e.g., `openspec/specs/auth/spec.md`)
     - **Change_Type**: Type of change (update / add / remove)
     - **Description**: What needs to change in the spec
     - **Justification**: Why the spec needs updating
   - **Risks** (optional): Any risks introduced
   - **Follow_Up** (optional): Related improvements needed

6. **Implement the fix**
   - Make minimal changes to fix the bug
   - Follow existing code patterns in the codebase
   - Write a regression test that:
     1. Fails before the fix
     2. Passes after the fix
     3. Catches similar bugs in the future

7. **Run validation gates**

   Execute project validation commands:

   ```bash
   pnpm test:unit
   pnpm lint
   pnpm type-check
   ```

   Ensure all pass before considering the fix complete.

8. **Mark tasks complete**

   Update tasks in the bugfix directory as completed.

9. **Show summary**

   Display:
   - Bug ID and description
   - Root cause
   - Files modified
   - Tests added
   - Validation status

**Guardrails**

- **Minimal changes**: Only fix the bug, don't refactor surrounding code
- **Always add regression test**: Every bugfix must include a test
- **Document root cause**: Helps prevent similar bugs and improve processes
- **Follow severity guidelines**: P0 bugs can use hotfix path, others use full workflow
- **Don't suppress type errors**: Fix them properly, never use `as any` or `@ts-ignore`

**Output Example**

```
## Bugfix Complete: login-button-error

**Root Cause**: Event listener context binding issue

**Files Changed**:
- src/components/LoginButton.tsx
- src/tests/regression/login-button-error.test.ts

**Testing**:
- Regression test added: ✓
- All unit tests pass: ✓
- Lint pass: ✓
- Type check pass: ✓

**Note**: The bug was caused by `this` binding in the click handler.
Fixed by converting to arrow function.
```

**Integration with Git**

When committing:

- Branch naming: `fix/<bug-id>`
- Commit message prefix: `fix:`
- Reference issue if applicable: `Fixes #123`
