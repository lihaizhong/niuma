---
description: Fix a bug using the bugfix workflow
---

Fix a bug using the streamlined bugfix workflow.

I'll help you fix bugs efficiently with minimal overhead and proper regression testing.

**Input**: The argument after `/opsx-bugfix` is the bug ID (e.g., `login-button-error`), OR a description of the bug symptom.

**Steps**

1. **If no input provided, ask about the bug**

   Use the **AskUserQuestion tool** to ask:

   > "What bug are you trying to fix? Describe the symptom or error."

   Derive a kebab-case bug ID from the description (e.g., "login button not working" → `login-button-not-working`).

2. **Create the bugfix change**

   ```bash
   openspec new bugfix "<bug-id>"
   ```

   This creates `openspec/bugs/<bug-id>/` with `.openspec.yaml`.

3. **Check status and get instructions**

   ```bash
   openspec status --bugfix "<bug-id>" --json
   ```

   Parse to understand:
   - Required artifacts (typically: bug-report, fix)
   - Current status of each artifact

4. **Create bug-report.md**

   Get instructions:

   ```bash
   openspec instructions bug-report --bugfix "<bug-id>" --json
   ```

   Interview the user to fill in:
   - **Symptom**: What's happening?
   - **Steps_to_Reproduce**: How to trigger it?
   - **Expected_Behavior**: What should happen?
   - **Actual_Behavior**: What actually happens?
   - **Environment**: OS, browser, versions

   Use **AskUserQuestion** for any missing critical information.

5. **Reproduce the bug**

   Attempt to reproduce based on the bug report:
   - If successful, document any additional details
   - If cannot reproduce, ask user for more information

6. **Create fix.md and implement**

   Document in fix.md:
   - **Root_Cause**: The actual cause found
   - **Fix_Description**: What was changed
   - **Files_Changed**: Modified files list
   - **Testing_Strategy**: How it was tested

   Then implement:
   - Make minimal changes to fix the bug
   - Add a regression test
   - Run: `pnpm test:unit`, `pnpm lint`, `pnpm type-check`

7. **Mark complete and summarize**

   Show summary:
   - Bug ID and root cause
   - Files modified
   - Tests added
   - Validation status

**Output Example**

```
## Bugfix Complete: login-button-error

**Root Cause**: Event listener context binding issue

**Files Changed**:
- src/components/LoginButton.tsx
- src/tests/regression/login-button-error.test.ts

**Testing**: All validations pass ✓
```

**Guardrails**

- Only fix the bug, don't refactor unrelated code
- Every bugfix must include a regression test
- Document the root cause for future prevention
- For P0 critical bugs, use hotfix override
