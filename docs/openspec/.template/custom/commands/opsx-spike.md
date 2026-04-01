---
description: Start a technical spike/research investigation
---

Start a technical spike or research investigation.

I'll help you explore technical questions, evaluate options, and reach a clear decision with proper documentation.

**Input**: The argument after `/opsx-spike` is the spike name (kebab-case), OR a description of what you want to research.

**Steps**

1. **If no input provided, ask about the research question**

   Use the **AskUserQuestion tool** to ask:

   > "What technical question do you want to explore? Describe the problem or options you're investigating."

   Derive a kebab-case spike name from the description (e.g., "evaluate state management libraries" → `evaluate-state-management`).

2. **Create the spike change**

   ```bash
   openspec new spike "<spike-name>"
   ```

   This creates `openspec/changes/<spike-name>/` with `.openspec.yaml` configured for the spike schema.

3. **Check status and get instructions**

   ```bash
   openspec status --spike "<spike-name>" --json
   ```

   Parse to understand:
   - Required artifacts (typically: research-question, exploration-log, decision)
   - Current status of each artifact

4. **Create research-question.md**

   Get instructions:

   ```bash
   openspec instructions research-question --spike "<spike-name>" --json
   ```

   Interview the user to fill in:
   - **Problem_Statement**: What problem are we trying to solve?
   - **Research_Goals**: What do we need to learn?
   - **Scope**: What's in scope vs out of scope?
   - **Constraints** (optional): Any limitations or requirements?
   - **Success_Criteria** (optional): How do we know we're done?
   - **Timebox** (optional): How much time to spend? (default: 4h)

   Use **AskUserQuestion** for any missing critical information.

5. **Create exploration-log.md**

   Guide the user through exploration:
   - Conduct research, experiments, code spikes
   - Document findings in real-time
   - Include both successful and failed experiments
   - Note tools evaluated, docs reviewed, code tested

   Structure the log:
   - **Approach**: How you're exploring
   - **Findings**: What you discovered
   - **Experiments_Conducted**: Code spikes, prototypes
   - **Pros_and_Cons**: Comparison of options

6. **Create decision.md**

   Synthesize findings into a clear decision:
   - **Summary**: Brief overview of research
   - **Recommendation**: The decision made
   - **Rationale**: Why this choice
   - **Alternatives_Considered**: Other options and why rejected
   - **Risks**: Any concerns
   - **Next_Steps**: What to do next (implementation? more research?)

7. **Mark complete and summarize**

   Show summary:
   - Spike name and research question
   - Key findings
   - Decision made
   - Recommended next steps

**Output Example**

```
## Spike Complete: evaluate-state-management

**Research Question**: Should we use Redux, Zustand, or Context API?

**Key Findings**:
- Zustand: 4KB, minimal boilerplate, excellent TypeScript support
- Redux Toolkit: 15KB+, more features, steeper learning curve
- Context: Built-in, but performance issues with frequent updates

**Decision**: Proceed with Zustand

**Rationale**: Fits our team size and complexity needs, lowest overhead

**Next Steps**:
- Create implementation ticket: migrate-auth-store
- Run /opsx-propose migrate-auth-store to implement
```

**Guardrails**

- Respect the timebox (default 4h, max 2d)
- Document as you go, don't wait until the end
- Include failed experiments - they teach too
- Must reach a clear decision (proceed/alternate/more research/don't proceed)
- Spike code is throwaway - production implementation is a separate change
- Don't gold-plate the exploration

**When to Use Spike**

- Evaluating technology choices (libraries, frameworks, tools)
- Exploring feasibility of an approach
- Investigating performance issues
- Researching unfamiliar domains
- Prototyping before committing to implementation
