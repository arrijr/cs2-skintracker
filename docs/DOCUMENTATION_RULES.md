# Documentation Rules

## Core Principle
**Every code change MUST update relevant documentation**

## When to Update Documentation

### API Changes
- [ ] Update `/docs/API.md` with new endpoints
- [ ] Add curl examples for new routes
- [ ] Update response schemas

### Database Changes
- [ ] Update `/docs/DATA_MODEL.md` with schema changes
- [ ] Update `/docs/CHANGELOG.md` with migration info

### Architecture Changes
- [ ] Update `/docs/ARCHITECTURE.md` with new flows
- [ ] Update Mermaid diagrams
- [ ] Document new services/integrations

### Feature Changes
- [ ] Create/update feature docs in `/docs/features/`
- [ ] Update `/docs/CHANGELOG.md`
- [ ] Add to `/docs/DECISIONS.md` if major decision

### Bug Fixes
- [ ] Add to `/docs/TROUBLESHOOTING.md`
- [ ] Update `/docs/CHANGELOG.md`

## Documentation Triggers

### Automatic Triggers
- New endpoint → API.md
- Schema change → DATA_MODEL.md
- New cron job → ARCHITECTURE.md
- New feature → features/ directory

### Manual Triggers
- Major refactoring → ARCHITECTURE.md
- Performance optimization → DECISIONS.md
- Security changes → SECURITY.md (if exists)

## Documentation Format

### Standard Structure
```markdown
## [Feature Name]

### Overview
Brief description

### Implementation
Technical details

### Usage
Examples

### Related Files
- `/path/to/file1.js`
- `/path/to/file2.tsx`
```

### Change Log Format
```markdown
## [Date] - [Type]: [Title]
- **Files Changed:** [list]
- **Description:** [what was done]
- **Impact:** [who/what is affected]
```

## Quality Checklist
- [ ] All changed files documented
- [ ] Examples provided
- [ ] Related files linked
- [ ] Breaking changes highlighted
- [ ] Migration steps included (if needed)
