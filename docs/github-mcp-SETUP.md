# GitHub MCP Server — CS2 Skin Tracker Integration

This guide integrates the GitHub MCP Server into your CS2 Skin Tracker project for fully automated Sprint 2 and beyond.

## Status

- **Server**: Production-ready, 16 tools implemented
- **Integration**: Ready for Claude Code + CS2 project
- **Phase**: Sprint 2 preparation

## What This Enables

With this MCP server, you can automate:

✅ **Code Pushes** — Push feature branches automatically  
✅ **Pull Requests** — Create, review, merge PRs via Claude  
✅ **Secrets Management** — Set DATABASE_URL, API keys without dashboard  
✅ **Workflow Triggers** — Start price-fetching job, deployments  
✅ **Issue Management** — Create bug reports, feature requests  
✅ **Release Management** — Tag releases, create changelogs  
✅ **File Operations** — Read code, list directory structure  

## Step 1: Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens/new
2. **Token name**: `claude-code-cs2`
3. **Expiration**: 90 days (rotate quarterly)
4. **Scopes** (required):
   - `repo` — Full control of repositories
   - `workflow` — Full control of GitHub Actions workflows
   - `admin:repo_hook` — Repository secrets and webhooks

5. Copy the token (starts with `ghp_`)
6. **Save securely** — You can only view it once

## Step 2: Set Up Token in Vercel

For your deployed backend to use this token (optional but recommended):

1. Go to https://vercel.com/cs2-skin-tracker/settings/environment-variables
2. Add new variable:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Your token from Step 1
   - **Environments**: Select your deployment environment

Don't add to git or `.env` (unless you rotate tokens frequently).

## Step 3: Install GitHub MCP Server

### Option A: Copy to Your Project

```bash
# In your CS2 project root
cp github-mcp.js ./scripts/github-mcp.js
```

### Option B: Global Installation

```bash
# Copy to a scripts directory
mkdir -p ~/.local/mcp-servers
cp github-mcp.js ~/.local/mcp-servers/github-mcp.js
chmod +x ~/.local/mcp-servers/github-mcp.js
```

## Step 4: Configure Claude Code

### For Claude Code CLI

Create or update `claude.json` in your project root:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["./scripts/github-mcp.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### For Cowork Extension

In Cowork settings, add MCP server:

```
Server: GitHub
Command: node ./scripts/github-mcp.js
Environment: GITHUB_TOKEN=ghp_xxx
```

## Step 5: Test the Connection

Start Claude Code with the GitHub MCP:

```bash
# Test with a simple list command
claude code "List all branches in cs2-skin-tracker"
```

Expected response:
```
✓ GitHub MCP server connected
✓ Authenticated as: your-github-username
✓ Branches listed:
  - main (protected)
  - develop
  - feature/sprint-2-price-service
```

## Usage Examples for CS2 Project

### Example 1: Create and Merge a PR

```
claude code "Create a PR from feature/price-service to develop 
in username/cs2-skin-tracker with title 'Add price fetching service' 
and body 'Implements real-time CS2 skin price updates via GitHub Actions'. 
Then merge it with squash."
```

Claude will:
1. Create PR with your title and body
2. Show PR number and URL
3. Merge with squash strategy
4. Return merge confirmation

### Example 2: Set Database Secrets

```
claude code "Set POSTGRES_URL to 'postgresql://...' in username/cs2-skin-tracker. 
List all secrets to confirm."
```

Claude will:
1. Encrypt and set the secret
2. List all secrets (values hidden)
3. Confirm DATABASE_URL is in the list

### Example 3: Trigger Price-Fetching Workflow

```
claude code "Trigger the price-fetch workflow in username/cs2-skin-tracker 
on the main branch, then get the run history for that workflow."
```

Claude will:
1. Trigger the workflow
2. Show recent runs, status, timestamps
3. Return run IDs for log retrieval

### Example 4: Create Sprint 2 Issues

```
claude code "Create 5 issues in username/cs2-skin-tracker:
1. 'Implement price fetching service' (backend, feature)
2. 'Add real-time price updates to frontend' (frontend, feature)
3. 'Set up GitHub Actions for price updates' (devops, feature)
4. 'Add historical volatility metrics' (backend, enhancement)
5. 'Create price API documentation' (docs, documentation)
Assign all to @your-username and add appropriate labels."
```

Claude will create all 5 issues with labels and assignments.

### Example 5: Create a Release

```
claude code "Create a release in username/cs2-skin-tracker 
with tag 'v0.2.0' and name 'Sprint 2 Alpha - Price Service'. 
Target the main branch. Body should describe the new price-fetching feature."
```

Claude will create a release with your details and tag.

## Sprint 2 Workflow Integration

### Phase 1: Start Feature Branch (GitHub MCP)

```
claude code "Create a branch 'feature/price-service' in 
username/cs2-skin-tracker from 'develop' branch."
```

### Phase 2: Implement Feature (Local Dev)

```
# Your local development
git checkout feature/price-service
# ... code, test, commit
git push origin feature/price-service
```

### Phase 3: Create PR (GitHub MCP)

```
claude code "Create a PR from feature/price-service to develop 
in username/cs2-skin-tracker. Title: 'Add price fetching service'. 
Body should describe what the price service does, which APIs it calls, 
and test coverage."
```

### Phase 4: Set Secrets if Needed (GitHub MCP)

```
claude code "Set PRICE_API_KEY secret in username/cs2-skin-tracker 
to the CoinGecko API key value."
```

### Phase 5: Trigger Workflow Tests (GitHub MCP)

```
claude code "Trigger the 'test' workflow in username/cs2-skin-tracker 
on the feature/price-service branch."
```

### Phase 6: Review and Merge (GitHub MCP)

```
claude code "Merge PR #42 in username/cs2-skin-tracker 
using squash merge. Custom message: 'Merge: Add price fetching service (refs #42)'"
```

### Phase 7: Deploy (GitHub MCP)

```
claude code "Trigger the 'deploy' workflow in username/cs2-skin-tracker 
on the main branch with environment=production."
```

## Command Reference

### Git Operations

```
# Create pull request
claude code "Create PR from BRANCH to BASE in OWNER/REPO with title 'TITLE' 
and body 'BODY'"

# Merge pull request
claude code "Merge PR #NUMBER in OWNER/REPO with squash method"

# Create branch
claude code "Create branch BRANCH_NAME from BASE in OWNER/REPO"

# List branches
claude code "List all branches in OWNER/REPO"
```

### Repository Secrets

```
# Set secret
claude code "Set SECRET_NAME to 'VALUE' in OWNER/REPO"

# List secrets
claude code "List all secrets in OWNER/REPO"
```

### Issues & Releases

```
# Create issue
claude code "Create issue 'TITLE' in OWNER/REPO with body 'BODY', 
label it LABEL, assign to @USER"

# List issues
claude code "List open issues in OWNER/REPO"

# Create release
claude code "Create release v1.0.0 in OWNER/REPO with tag v1.0.0, 
name 'Release Name', body 'Release notes'"
```

### Workflows

```
# List workflows
claude code "List all workflows in OWNER/REPO"

# Trigger workflow
claude code "Trigger workflow 'WORKFLOW_NAME' in OWNER/REPO on main branch"

# Get workflow runs
claude code "Get recent runs for workflow 'WORKFLOW_NAME' in OWNER/REPO"

# Get workflow logs
claude code "Get logs for workflow run RUN_ID in OWNER/REPO"
```

### Repository Info

```
# Get repo metadata
claude code "Get info for OWNER/REPO"

# List files
claude code "List files in OWNER/REPO path 'src/'"

# Get file content
claude code "Show content of 'README.md' in OWNER/REPO"
```

## Security Best Practices

1. **Token Rotation** — Rotate token every 90 days
2. **Minimal Scopes** — Only request needed scopes
3. **Environment Isolation** — Keep token in `.env.local`, not git
4. **Log Review** — Check GitHub audit logs regularly
5. **Revocation** — Revoke token at https://github.com/settings/tokens

### Token Storage Options

**Option 1: Environment Variable**
```bash
export GITHUB_TOKEN=ghp_xxx
node github-mcp.js
```

**Option 2: .env File (git-ignored)**
```bash
# .env
GITHUB_TOKEN=ghp_xxx

# Then:
source .env && node github-mcp.js
```

**Option 3: Claude Code Config**
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

Never commit tokens to git.

## Troubleshooting

### "Authentication failed"

```
Error: GitHub MCP Server — Authentication failed
```

**Fix:**
1. Check token is set: `echo $GITHUB_TOKEN`
2. Verify token isn't expired at https://github.com/settings/tokens
3. Regenerate token if needed

### "Invalid Request"

```
Error: Invalid Request: jsonrpc must be 2.0
```

**Fix:**
- This is a protocol error (internal to MCP)
- Usually means server isn't starting correctly
- Check that node version is 14+

### "Unknown tool"

```
Error: Unknown tool: git_create_pull_request
```

**Fix:**
- Check tool name spelling
- List available tools: `claude code "What GitHub tools are available?"`

### "Rate limit exceeded"

```
Error: HTTP 403 — API rate limit exceeded
```

**Fix:**
- Wait 1 hour for limit reset
- Or use a new token with higher limits
- GitHub: 5,000 requests/hour for authenticated requests

## Integration with CLAUDE.md

Update your `CLAUDE.md` working memory:

```markdown
## Sprint 2 Workflow

**GitHub MCP Server**: Production ready ✅
- 16 tools implemented
- Token: Set in .env
- Integration: Ready for Claude Code

**Automated Tasks**:
- PR creation/merge: `git_create_pull_request` + `git_merge_pull_request`
- Secret management: `github_set_secret`
- Workflow triggers: `github_trigger_workflow`
- Issue management: `github_create_issue`

**Examples**:
- "Create PR from feature/price-service to develop"
- "Set DATABASE_URL secret to ..."
- "Trigger price-fetch workflow on main"
```

## Next Steps

1. **Test locally** — Run the GitHub MCP server, test with Claude Code
2. **Integrate into CI/CD** — Add to GitHub Actions if needed
3. **Document workflows** — Create `.github/workflows/claude-automation.yml`
4. **Monitor usage** — Check GitHub audit logs for token usage
5. **Rotate token** — Set reminder for 90-day rotation

## Support

For issues:
1. Check troubleshooting section above
2. Review GitHub MCP specification: https://github.com/github/github-mcp-server
3. Test token at https://api.github.com/user with curl:
   ```bash
   curl -H "Authorization: Bearer ghp_xxx" https://api.github.com/user
   ```

## Files Included

- `github-mcp.js` — Full MCP server implementation
- `github-mcp-README.md` — Complete API reference
- `github-mcp-SETUP.md` — This integration guide

---

**Last Updated**: 2026-05-07  
**Status**: Production Ready ✅
