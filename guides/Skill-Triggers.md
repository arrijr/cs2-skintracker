# Skill Triggers - CS2 Skin Tracker

Automatic skill invocation rules. When I (Claude) recognize these patterns, I will invoke the corresponding skill **without asking first**.

---

## Core Rules

1. **I recognize the pattern** from your message or action
2. **No permission needed** — I invoke the skill automatically
3. **Results documented** — Findings go to Obsidian or chat summary
4. **You review + approve** — Recommended actions, but you decide execution

---

## Trigger Mapping

### After Code Review
**Pattern**: "Code review done" / "Here's the code review report"  
**Skill**: `engineering:testing-strategy`  
**Why**: Once risks are identified, we need to design tests to mitigate them  
**Output**: Testing plan with unit, integration, and load tests

### After Features Ship
**Pattern**: "Feature is live" / "Component deployed" / "New endpoint ready"  
**Skill**: `design:design-system` (if UI) or `engineering:documentation` (if API)  
**Why**: New code should be cataloged to prevent future duplication  
**Output**: Design system update or API documentation

### End of Sprint
**Pattern**: End of sprint reached / "Sprint 1 done"  
**Skill**: `operations:status-report`  
**Why**: Stakeholders need to know progress, blockers, next steps  
**Output**: Status report with metrics, risks, action items

### Start of Sprint
**Pattern**: "Planning Sprint 2" / "Ready for next sprint"  
**Skill**: `product-management:sprint-planning`  
**Why**: Capacity planning, dependency mapping, priority alignment  
**Output**: Sprint plan with tasks, estimates, dependencies

### Tech Debt Detected
**Pattern**: "This code is messy" / "We're duplicating logic" / Code review finds refactoring opportunities  
**Skill**: `engineering:tech-debt`  
**Why**: Catalog debt, prioritize repayment, prevent accumulation  
**Output**: Tech debt registry with severity and ROI

### SEO/Content Opportunities
**Pattern**: "We should optimize for search" / "Need marketing content"  
**Skill**: `searchfit-seo:seo-audit` or `searchfit-seo:content-strategy`  
**Why**: CS2 Tracker will have a marketing site; needs SEO strategy  
**Output**: SEO audit report or content roadmap

### Performance Bottleneck Found
**Pattern**: "API is slow" / "Response time degraded" / Load tests show issues  
**Skill**: `data:analyze` or `engineering:architecture`  
**Why**: Data-driven diagnosis, then architectural fix  
**Output**: Performance analysis + redesign recommendations

### Security Issue Found
**Pattern**: "Credentials leaked" / "SQL injection risk" / Auth bypass discovered  
**Skill**: `engineering:code-review` (if not already done) + escalate manually  
**Why**: Security requires immediate action and documentation  
**Output**: Risk assessment + remediation plan

---

## When NOT to Invoke Skills

- **Ongoing conversation**: If you're asking quick questions, I answer directly
- **Exploratory work**: "What if we did X?" — discuss before invoking skills
- **Already in progress**: If a skill is running, don't re-invoke
- **Waiting for Claude Code**: Skills don't replace code execution; they analyze/plan

---

## Creating New Skills

If a repeating need doesn't match existing skills:

1. **Identify the pattern** — What's the pattern that triggers this need?
2. **Check existing skills** — Search `/skills` to avoid duplication
3. **Propose the skill** — Suggest name + trigger pattern to you
4. **Register in this guide** — Add trigger mapping here once created
5. **Document in claude.md** — Link to the new skill

Example need: "We need to review our database schema against best practices"
- Potential skill: `engineering:database-audit` (if it doesn't exist)
- Trigger: "Database design review needed" / "Schema looks inefficient"
- Output: Audit report with normalization issues, missing indexes, etc.

---

## Skill Categories

**Engineering**: code-review, debug, testing-strategy, architecture, documentation, tech-debt, deploy-checklist  
**Product**: sprint-planning, roadmap-update, product-brainstorming, write-spec, metrics-review  
**Design**: design-system, user-research, design-critique, ux-copy  
**Data/Analytics**: analyze, create-viz, validate-data, sql-queries  
**Marketing**: seo-audit, content-strategy, competitive-brief, brand-review  
**Operations**: status-report, process-optimization, capacity-plan, vendor-review  
**Customer Support**: draft-response, ticket-triage, kb-article  
**Finance**: reconciliation, variance-analysis, financial-statements  

For CS2 Tracker, the most relevant are: Engineering, Product, Data, Marketing, Operations.

---

## Disabling Auto-Triggers

If you want to disable automatic skill invocation temporarily:
- Say: "Skip skills this time" or "Just give me the answer, no skills"
- I'll answer conversationally without invoking skills
- Useful when you want quick feedback before formal analysis

---

## Session Handoff

When picking up work in a new session:
1. Check [[../claude.md|claude.md]] for recent skill invocations
2. If a skill was started but not completed, I'll resume it
3. If new patterns emerged, I may add new triggers to this guide
4. Always ask "What happened since last session?" if context is unclear

---

See: [[../claude.md|Working Memory]]
