# Token Optimization - CS2 Skin Tracker

How to write efficient prompts for Claude Code to maximize output quality while minimizing token usage.

---

## Token Budget

**Total context window**: 200,000 tokens  
**Current usage**: ~130k tokens (including this session's docs + previous context)  
**Available for work**: ~70k tokens

**Target**: Use tokens efficiently so we can handle long conversations + complex tasks without running out.

---

## Token Costs by Content Type

| Content | Cost | Example |
|---------|------|---------|
| Short question | 50-100 | "Is this code safe?" |
| Code snippet (50 lines) | 200-400 | Full function with comments |
| File read output | 100-500 | Reading a 500-line file |
| Prompt to Claude Code | 200-800 | Detailed task description |
| Function/skill invocation | 100-300 | `engineering:code-review` |
| External guide (500 lines) | 1000-1500 | All of Development-Workflow.md |

**Key insight**: Large external guides are expensive to read repeatedly. Keep them organized so I only need to read what's relevant.

---

## Writing Efficient Prompts to Claude Code

### ✅ DO: Be Specific

**Good** (saves tokens):
```
Review /src/auth.ts for security issues.
Check for: credential leaks, auth bypasses, weak hashing.
Output to /outputs/auth-review.md
```

**Bad** (wastes tokens, requires clarification):
```
Review the code for problems
```

### ✅ DO: Cite Existing Code

**Good** (saves re-explaining):
```
In db.ts, the getUser function does [existing pattern].
Apply the same pattern to getPriceHistory.
Reference: /src/db.ts:42-60
```

**Bad** (wastes tokens, vague):
```
Make this function like the other ones
```

### ✅ DO: Specify Output Location & Format

**Good**:
```
Output summary to /outputs/summary.md
Include: table of findings, code snippets, risk levels
```

**Bad**:
```
Summarize what you find
```

### ✅ DO: Group Related Tasks

**Good** (one prompt, multiple tasks):
```
1. Add unit tests for auth.ts (3 tests: valid key, expired key, invalid key)
2. Add integration test for /api/subscribe endpoint (test Stripe webhook)
3. Output to /outputs/tests.ts
```

**Bad** (separate prompts, redundant context):
```
Add tests for auth
(wait for response)
Add integration tests
(wait for response)
```

### ✅ DO: Reference External Guides

**Good** (I don't have to re-read the guide):
```
Implement logging per [[guides/Production-Checklist|Production-Checklist]] 
(Item: "Structured logging is implemented")
Use winston or similar. Output to /src/logger.ts
```

**Bad** (makes me re-read the entire guide):
```
We need logging according to our docs. What should we do?
```

---

## Prompts That Waste Tokens

### ❌ Overly Verbose Prompts

**Wastes tokens** (100+ unnecessary words):
```
I'm thinking about the fact that our code needs to be reviewed.
We have several files in the backend. I'm wondering if we could check
if there are any issues with security. Also, I'd like to know about
performance. Please go through the code and tell me everything you think.
```

**Better** (gets the same result with 1/3 the words):
```
Security + performance review of /src/auth.ts and /src/db.ts.
Output to /outputs/code-review.md with: issues found, severity, fix.
```

### ❌ Asking Without Context

**Wastes tokens** (requires clarification back-and-forth):
```
Should we optimize the database?
```

**Better** (I don't need to ask questions):
```
Run a load test on db.ts (500 requests, 10 concurrent).
Measure response times, identify slow queries.
Output: /outputs/perf-report.md
```

### ❌ Repeating Information

**Wastes tokens** (duplication across multiple prompts):
```
Remember the business context says we need 99.5% uptime.
Also, we need <100ms response times.
And we use PostgreSQL. 
These are our non-negotiables...
```

**Better** (reference the guide once):
```
Per [[guides/Business-Context|Business-Context]], verify we meet the non-negotiables:
- 99.5% uptime: check GitHub Actions success rate, Vercel logs
- <100ms p95: run load test
- Report to /outputs/nfr-validation.md
```

---

## Context-Efficient Workflow

### Session Start
1. Claude Code prompt should reference external guides, not re-explain them
2. I read only relevant guides (not all 5 at once)
3. Skip summaries when possible (just start working)

### Mid-Session
1. Reuse information from earlier in the session (don't re-explain)
2. Reference file paths instead of pasting code
3. Use "As discussed earlier" shortcuts

### Session End
1. Update claude.md (single source of truth for status)
2. Don't write new documentation files unless necessary
3. Link to existing guides for context

### Session Handoff
1. New session reads claude.md (short, <80 lines)
2. New session reads only relevant guide (not all 5)
3. Say "What's the current status?" to pick up where we left off

---

## Compact Prompts: Examples

### Prompt: Code Review
**Full version** (800 tokens):
```
[Entire business context pasted]
[Entire architectural design pasted]
[Entire security requirements pasted]
Review /src/auth.ts...
```

**Compact version** (200 tokens):
```
Per [[guides/Business-Context|Business-Context]] security non-negotiables,
review /src/auth.ts for:
- API key hashing (SHA-256 required)
- JWT validation (per Clerk SDK)
- Auth bypass risks
Output: /outputs/auth-review.md
```

### Prompt: Test Strategy
**Full version** (600 tokens):
```
Based on our product requirements and architecture, we need tests for...
Here's what we tested before... Here's what we didn't... Maybe we should...
```

**Compact version** (150 tokens):
```
Per [[guides/Production-Checklist|Production-Checklist]], 
design tests for:
- Stripe webhook signature verification
- Rate limiting (pro tier: 10k calls/day)
- Clerk JWT expiry handling
Output: /outputs/test-strategy.md
```

---

## When to NOT Optimize for Tokens

**Use full context when:**
- Exploring new architecture (needs room to think)
- Debugging complex issue (need detailed error messages)
- Initial planning phase (brainstorming wastes tokens, but pays off)

**Use compact prompts for:**
- Routine tasks (code review, tests, documentation)
- Executing known patterns (API endpoint, middleware, etc.)
- Fixing issues you understand

---

## Token Tracking

Current session tokens:
- [When Claude reads this file, ~300 tokens are used]
- [Each prompt to Claude Code: ~200-500 tokens]
- [Each skill invocation: ~100-300 tokens]

**Target**: Keep active tasks to 3-5 concurrent items. When starting a new sprint, reset by:
1. Documenting completed work in Obsidian
2. Summarizing learnings in claude.md
3. Archiving old prompts
4. Starting fresh session with only active context

---

## Tools for Token Counting

- **Claude.ai**: Shows token count in the interface
- **OpenAI tokenizer**: https://platform.openai.com/tokenizer (estimates)
- **Rough count**: ~4 characters per token (so 1000 words ≈ 1500 tokens)

---

## Future Optimization

As the project grows:
- [ ] Move very large external guides to sub-files (e.g., /Architecture-Decisions-Backend.md)
- [ ] Archive completed sprint docs to /archive instead of /docs
- [ ] Create quick-reference checklists (1-page versions of longer guides)
- [ ] Use GitHub issues for feature tracking (reduce doc size)

---

See: [[../claude.md|Working Memory]]
