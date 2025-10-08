# Speed Development Workflow

## Quick Start Commands

### Local Development
```bash
# Terminal 1 - Backend (PowerShell)
cd backend; npm run dev

# Terminal 2 - Frontend (PowerShell) 
cd frontend; npm run dev

# Terminal 3 - Database (if needed)
cd backend; npx prisma studio
```

### Git Workflow
```bash
# Quick commit with auto-push
git add .; git commit -m "feat: description"; git push

# Branch workflow
git checkout -b feature/new-feature
# ... make changes ...
git add .; git commit -m "feat: new feature"; git push -u origin feature/new-feature
```

## MCP Server Usage

### Memory MCP
- Store project context between sessions
- Track what needs documentation
- Remember decisions and architecture

### GitHub MCP  
- Automatic commits with proper messages
- Branch management
- PR creation

### Shadcn MCP
- Quick component discovery
- Installation commands
- Usage examples

### Browser Tools MCP
- Quick testing of frontend changes
- Screenshot comparisons
- Performance audits

## Automation Tips

### 1. Parallel Development
- Run backend + frontend simultaneously
- Use hot-reload for instant feedback
- Keep database studio open for data inspection

### 2. Documentation Automation
- Use Memory MCP to track what needs docs
- Create templates for common doc types
- Auto-update changelog on commits

### 3. Testing Strategy
- Use Browser Tools for quick frontend tests
- Automated API testing with curl examples
- Screenshot testing for UI changes

### 4. Code Organization
- Use consistent file structure
- Keep components small and focused
- Use TypeScript for better IDE support

## Common Tasks Speed Tips

### Adding New Feature
1. Create branch: `git checkout -b feature/name`
2. Use Shadcn MCP for UI components
3. Use Memory MCP to track progress
4. Commit frequently with descriptive messages
5. Update docs automatically

### Bug Fixes
1. Reproduce in browser using Browser Tools
2. Fix in code with hot-reload
3. Test immediately
4. Document in TROUBLESHOOTING.md
5. Commit with fix: prefix

### API Changes
1. Update controller first
2. Test with curl/Postman
3. Update frontend integration
4. Update API.md automatically
5. Commit with feat: or fix: prefix

## Performance Tips

### Development Speed
- Use TypeScript for autocomplete
- Keep components under 200 lines
- Use consistent naming conventions
- Leverage hot-reload effectively

### Deployment Speed
- Use Vercel/Render auto-deploy
- Test in staging first
- Use feature flags for gradual rollout
- Monitor with deployment logs

## Troubleshooting Speed

### Common Issues
- PowerShell `&&` → use `;` instead
- Port conflicts → kill processes with `netstat -ano | findstr :3000`
- Database issues → reset with `npx prisma migrate reset`
- Cache issues → clear with `npm run clean` (if available)

### Quick Fixes
- Backend not starting → check .env file
- Frontend not loading → check API_URL
- Database connection → check DATABASE_URL
- Authentication → check Clerk keys
