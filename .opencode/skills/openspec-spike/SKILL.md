---
name: openspec-spike
description: Technical research and exploratory investigation workflow. Use when the user wants to explore technical questions, evaluate options, prototype solutions, or investigate feasibility before committing to implementation.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: niuma
  version: "1.0"
---

Implement technical research using the spike schema workflow.

**Trigger**: Use when the user wants to research technical options, explore feasibility, evaluate libraries/frameworks, or investigate a problem before implementation. Keywords: "research", "explore", "evaluate", "compare", "investigate", "spike", "prototype", "feasibility", "should we use".

**Input**: Optionally specify a spike name (kebab-case, e.g., "evaluate-state-management"). If omitted, generate one from the research description.

**Steps**

1. **Create the spike change**

   ```bash
   openspec new spike "<spike-name>"
   ```

   This creates `openspec/changes/<spike-name>/` with `.openspec.yaml` configured for the spike schema.

2. **Check status and get instructions**

   ```bash
   openspec status --spike "<spike-name>" --json
   ```

   Parse the JSON to understand:
   - `schemaName`: Should be "spike"
   - `artifacts`: List of required artifacts and their status
   - `applyRequires`: Artifacts needed to complete the spike (typically ["research-question", "exploration-log", "decision"])

3. **Create research-question.md artifact**

   Get instructions:

   ```bash
   openspec instructions research-question --spike "<spike-name>" --json
   ```

   Create the artifact with these sections:
   - **Problem_Statement**: What problem or question are we researching?
   - **Research_Goals**: What specific things do we need to learn?
   - **Scope**: What's in scope vs explicitly out of scope
   - **Constraints** (optional): Any technical or business constraints
   - **Success_Criteria** (optional): How will we know the research is complete?
   - **Timebox** (optional): Recommended time limit (default: 4h, max: 2d)

4. **Create exploration-log.md artifact**

   Get instructions:

   ```bash
   openspec instructions exploration-log --spike "<spike-name>" --json
   ```

   Document the exploration process:
   - **Approach**: How you're conducting the research
   - **Findings**: Key discoveries (organize by topic or chronologically)
   - **Experiments_Conducted**: Code spikes, prototypes, tests performed
   - **Tools_Evaluated**: Libraries, frameworks, services considered
   - **Documentation_Reviewed**: Articles, docs, videos referenced
   - **Pros_and_Cons**: Comparison matrix of options

   **Important**: Include failed experiments and dead ends - they provide valuable learning.

5. **Create decision.md artifact**

   Get instructions:

   ```bash
   openspec instructions decision --spike "<spike-name>" --json
   ```

   Synthesize findings into a clear decision:
   - **Summary**: Brief recap of what was researched
   - **Recommendation**: The decision (must be one of):
     - Proceed with [specific approach/technology]
     - Use [option A] over [option B]
     - Need more research (with specific open questions)
     - Don't proceed (with clear rationale)
   - **Rationale**: Detailed reasoning for the decision
   - **Alternatives_Considered**: Other options evaluated and why rejected
   - **Risks**: Potential risks or concerns with the chosen approach
   - **Next_Steps**: Specific actions to take next:
     - Create implementation change (use spec-driven workflow)
     - Conduct additional spike (narrower scope)
     - Abandon this direction

6. **Guide the exploration process**

   As the user conducts research:
   - Ask clarifying questions to focus the investigation
   - Suggest experiments or comparisons to make
   - Help structure findings as they emerge
   - Remind about timebox constraints
   - Encourage documenting failures as well as successes

7. **Ensure decision quality**

   Before marking complete, verify:
   - Is the recommendation clear and actionable?
   - Are alternatives documented with reasoning?
   - Are there clear next steps?
   - If recommending "proceed", is there enough detail to start implementation?

8. **Show summary**

   Display:
   - Spike name and research question
   - Time spent vs timebox
   - Key findings summary
   - Decision made
   - Recommended next steps

**Guardrails**

- **Respect the timebox**: Default 4h, max 2d. Document partial findings if time runs out.
- **Document as you go**: Don't wait until the end. Capture findings in real-time.
- **Throwaway code is OK**: Spike code doesn't need tests. Mark it clearly as experimental.
- **Must reach a conclusion**: Every spike ends with a clear decision, even if that decision is "need more research".
- **No production code**: Spike artifacts are documentation. Implementation is a separate spec-driven change.
- **Include failures**: Document what didn't work - it teaches as much as successes.
- **Avoid gold-plating**: Don't over-engineer the exploration. Good enough is good enough.

**Output Example**

```
## Spike Complete: evaluate-state-management

**Research Question**: Which state management library fits our needs?

**Timebox**: 4 hours | **Actual**: 3.5 hours

**Key Findings**:
- Zustand (4KB): Excellent TypeScript, minimal boilerplate, great dev tools
- Redux Toolkit (15KB+): More features, steeper learning curve, overkill for our use case
- Context API: Built-in but re-renders too frequently for our dashboard

**Decision**: Proceed with Zustand

**Rationale**:
- Lowest bundle size impact
- Fits team expertise level
- Sufficient for current complexity
- Easy to migrate if needs grow

**Risks**:
- Smaller community than Redux
- May need migration if app complexity increases significantly

**Next Steps**:
- Create implementation change: /opsx-propose migrate-auth-store
- Estimated effort: 1-2 days
```

**Integration with Other Workflows**

When the spike recommends implementation:

1. Archive the spike change (it becomes documentation)
2. Create a new spec-driven change for implementation:
   ```
   /opsx-propose <implementation-name>
   ```
3. Reference the spike findings in the new change's proposal.md

**When to Spike vs Spec-Driven**

| Use Spike                          | Use Spec-Driven                       |
| ---------------------------------- | ------------------------------------- |
| Don't know which technology to use | Know what to build, need to implement |
| Need to validate feasibility       | Requirements are clear                |
| Comparing multiple approaches      | Single clear solution                 |
| Investigating performance issue    | Building a known feature              |
| Exploring unfamiliar domain        | Familiar domain with clear scope      |

**Examples of Good Spike Topics**

- "Evaluate React Query vs SWR for data fetching"
- "Prototype new payment provider integration"
- "Investigate slow dashboard rendering"
- "Compare CSS-in-JS solutions"
- "Explore WebSocket vs Server-Sent Events for real-time features"
