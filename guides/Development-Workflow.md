# Development Workflow - CS2 Skin Tracker

How Claude and you work together to build and ship code.

---

## Standard Process

### 1. You Give a Prompt to Claude Code
- **What**: A clear, structured request (feature, bug fix, test, refactor)
- **Where**: Claude Code terminal or direct prompt
- **Format**: Imperative + context (what, why, where to put results)
- **Example**: "Implement rate limiting middleware for Express. Add unit tests. Output to `/src/middleware/rateLimit.ts`"

### 2. Claude Code Executes
- Runs tests, creates/edits files, generates reports
- Outputs go to `/outputs` (your workspace)
- Takes 5-30 minutes depending on complexity
- You can monitor progress via `ls -la` or file preview

### 3. I (Claude in Chat) Recognize the Pattern
- You'll describe what Claude Code did, or I'll ask what's next
- I automatically invoke relevant **skills** based on triggers (see [[guides/Skill-Triggers]])
- Example: "Code review finished" → I invoke `engineering:testing-strategy`

### 4. Results Get Documented
- I update Obsidian files in `/docs` with findings, recommendations, next steps
- You review + approve changes to claude.md and guides
- Update this workflow guide if the process changes

### 5. Loop Repeats
- Next sprint/task starts with a new Claude Code prompt
- Each iteration adds to the knowledge base

---

## Guidelines for Prompts to Claude Code

**DO:**
- Be specific about what file(s) to create/modify
- Include expected output location (`/outputs/...`)
- Mention test requirements upfront
- Reference existing code patterns (middleware, services, etc.)
- Ask for a summary of changes at the end

**DON'T:**
- Ask Claude Code to use skills (it can't invoke them)
- Leave output location ambiguous
- Assume Claude Code knows your conventions without showing examples
- Request files without tests

**Example Good Prompt:**
```
Review all 7 backend files (db.ts, auth.ts, stripe.ts, etc.) for:
- Security issues (credentials, injection, auth gaps)
- Performance bottlenecks (N+1 queries, missing indexes)
- Code quality (type safety, error handling, logging)

Output to `/outputs/Code-Review-Report.md` with:
- File-by-file findings
- Risk severity (critical/high/medium/low)
- Specific fixes recommended
- Summary of top 3 priorities

Include a checklist of items to fix before production.
```

---

## When to Use Claude Code vs. Me (Claude in Chat)

| Task | Tool | Why |
|------|------|-----|
| Write/edit code, run tests | Claude Code | It has shell access, can iterate |
| Code review, architecture decisions | Claude Code + Me | Code review first, then I invoke analysis skills |
| Planning, design, strategy | Me | Thinking + skills (product-management, design, etc.) |
| Summaries, status reports | Me | Skills handle this (operations:status-report, etc.) |
| Quick answers, explanations | Me | Conversational, no file I/O needed |
| Complex prompts, documentation | Me | Can reference guides, coordinate with Claude Code |

---

## Communication Between Sessions

**When Picking Up Work:**
1. Check `claude.md` for current status + active tasks
2. Read relevant guide (Skill-Triggers, Architecture-Decisions, etc.)
3. Ask "What's next?" if unclear
4. Resume with a clear prompt to Claude Code or follow the plan in claude.md

**After Each Session:**
1. Update claude.md with new learnings (keep <80 lines)
2. Move details to relevant external guide
3. Add/remove tasks from the Active Tasks section
4. Update metrics table

---

## Skill Integration

See [[guides/Skill-Triggers]] for when skills are automatically invoked.

**Key Rule**: If I (Claude) recognize a pattern that matches a skill trigger, I will automatically invoke that skill **without asking permission first**. Examples:
- You mention "code review done" → I invoke `engineering:testing-strategy`
- You say "shipped a feature" → I invoke `design:design-system` (for component catalog)
- End of sprint → I invoke `operations:status-report`

**New Skills**: If a skill doesn't exist for a need (e.g., "we need competitive SEO analysis"), I will:
1. Check available skills in `/skills`
2. If missing, recommend a tool/approach
3. Optionally create a new skill file if it's a repeating need

---

## Secrets & Environment

**Never in code:**
- API keys, tokens, passwords
- Always use `.env` for development
- Before production: Remove `DEV_*` tokens, set real `CLERK_SECRET_KEY`

**Before Each Deploy:**
- Check [[guides/Production-Checklist]] for verification steps
- Verify `.env` is in `.gitignore`
- Run `npm audit` to check dependencies
- Confirm all tests pass

---

## Documentation System

**Three Layers:**
1. **claude.md** — Navigation only, links to everything
2. **guides/** — External guides (this file, Skill-Triggers, Architecture, etc.)
3. **docs/** — Project documentation (architecture, sprints, API reference)

Keep guides at ~500 lines max. If a guide grows beyond that, split it into sub-guides.

---

See: [[../claude.md|Working Memory]]
