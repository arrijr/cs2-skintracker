# GitHub MCP Server

A production-ready Model Context Protocol (MCP) server for GitHub operations. Fully implements the official GitHub MCP specification with 16 tools for complete GitHub automation.

## Features

- **JSON-RPC 2.0 Protocol** — Standard MCP interface
- **16 GitHub Tools** — Complete git, repository, and workflow automation
- **Secure Token Handling** — GITHUB_TOKEN from environment, never hardcoded
- **Error Handling** — Clear error messages and API rate limit awareness
- **Production Ready** — Type-safe, tested, documented

## Tools Included

### Git Operations (5 tools)
- `git_push` — Push commits to branches
- `git_create_pull_request` — Create PRs with title, body, base/head
- `git_merge_pull_request` — Merge PRs (squash/rebase/merge)
- `git_create_branch` — Create new branches from base
- `git_list_branches` — List all branches in a repo

### Repository Management (6 tools)
- `github_set_secret` — Set repository secrets (for workflows)
- `github_list_secrets` — List all secrets (names only, values hidden)
- `github_create_issue` — Create issues with labels/assignees
- `github_list_issues` — List open/closed issues
- `github_create_release` — Create releases and tags

### Workflow Management (4 tools)
- `github_list_workflows` — List GitHub Actions workflows
- `github_trigger_workflow` — Manually trigger workflows
- `github_get_workflow_runs` — Get run history for a workflow
- `github_get_workflow_run_logs` — Get logs from a run

### Repository Information (3 tools)
- `github_get_repository` — Get repo metadata
- `github_list_files` — List files in repo (tree view)
- `github_get_file_content` — Get raw file content

## Getting Started

### 1. Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens/new
2. Select scopes:
   - `repo` — Full control of private/public repos
   - `workflow` — Full control of GitHub Actions workflows
   - `admin:repo_hook` — Full control of repository hooks/secrets
3. Copy the token (starts with `ghp_`)
4. Save securely (you can only view it once)

### 2. Start the Server

```bash
# Set token in environment
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Run the server
node github-mcp.js

# You should see:
# GitHub MCP Server starting...
# Validated as: your-github-username
# Ready to handle requests
```

### 3. Enable in Claude Code

Add to your Claude Code configuration:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/github-mcp.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    }
  }
}
```

## Usage Examples

### Create and Merge a Pull Request

```
I need to create a PR from feature/my-feature to main in owner/repo, 
then merge it with squash. The PR title should be "Add new feature" 
and the description should be "This implements X and fixes Y".
```

Claude will:
1. Call `git_create_pull_request` with owner, repo, title, body, head/base
2. Get the PR number from response
3. Call `git_merge_pull_request` with merge_method: 'squash'
4. Return confirmation with merged SHA

### Set GitHub Secrets for Workflow

```
Set the DATABASE_URL secret to "postgres://..." in owner/repo, 
then list all secrets to confirm it was added.
```

Claude will:
1. Call `github_set_secret` with owner, repo, secret_name, secret_value
2. Encrypt the value using GitHub's public key
3. Call `github_list_secrets` to show what secrets exist

### Trigger a Workflow

```
Trigger the "Deploy" workflow in owner/repo on the main branch, 
then get the run history for that workflow.
```

Claude will:
1. Call `github_trigger_workflow` with workflow_id and ref
2. Call `github_get_workflow_runs` to show recent runs
3. Return run IDs, status, and timestamps

### Create an Issue

```
Create an issue titled "Fix login bug" in owner/repo with description 
"Users can't log in on mobile" and assign it to @alice, label it 'bug' 
and 'critical'.
```

Claude will:
1. Call `github_create_issue` with title, body, labels, assignees
2. Return issue number, URL, and state

## API Reference

All tools follow the same pattern:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "owner": "username",
      "repo": "repo-name",
      ...additional args
    }
  }
}
```

### Git Operations

#### `git_create_pull_request`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "title": "PR Title",
  "body": "PR description",
  "head": "feature-branch",
  "base": "main"
}
```
Response includes: `number`, `html_url`, `state`, `title`

#### `git_merge_pull_request`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "pull_number": 42,
  "merge_method": "squash|rebase|merge",
  "commit_title": "Custom title (optional)",
  "commit_message": "Custom message (optional)"
}
```
Response includes: `merged`, `message`, `sha`

#### `git_create_branch`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "branch": "new-branch-name",
  "base": "main"
}
```
Response includes: `ref`, `node_id`, `url`

#### `git_list_branches`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "per_page": 30
}
```
Response includes: `count`, array of branches with `name`, `protected`, `commit.sha`

### Repository Management

#### `github_set_secret`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "secret_name": "DATABASE_URL",
  "secret_value": "postgres://..."
}
```
Response: `status: 'success'`

Note: Requires encryption. Server attempts auto-encryption with libsodium, but you may need to install it:
```bash
npm install libsodium.js
```

#### `github_list_secrets`
```json
{
  "owner": "username",
  "repo": "repo-name"
}
```
Response includes: `count`, array of secrets with `name`, `created_at`, `updated_at` (values are hidden)

#### `github_create_issue`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "title": "Issue Title",
  "body": "Description",
  "labels": ["bug", "critical"],
  "assignees": ["username1", "username2"]
}
```
Response includes: `number`, `html_url`, `state`

#### `github_list_issues`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "state": "open|closed|all",
  "per_page": 30
}
```
Response includes: `count`, array of issues with `number`, `title`, `state`, `html_url`, `created_at`

#### `github_create_release`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "tag_name": "v1.0.0",
  "target_commitish": "main",
  "name": "Release 1.0.0",
  "body": "Release notes",
  "draft": false,
  "prerelease": false
}
```
Response includes: `id`, `tag_name`, `html_url`, `published_at`

### Workflow Management

#### `github_list_workflows`
```json
{
  "owner": "username",
  "repo": "repo-name"
}
```
Response includes: `count`, array of workflows with `id`, `name`, `path`, `state`, `html_url`

#### `github_trigger_workflow`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "workflow_id": "deploy.yml",
  "ref": "main",
  "inputs": {
    "environment": "production",
    "version": "1.0.0"
  }
}
```
Response: `status: 'success'`

#### `github_get_workflow_runs`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "workflow_id": "deploy.yml",
  "per_page": 30
}
```
Response includes: `count`, array of runs with `id`, `status`, `conclusion`, `created_at`, `html_url`

#### `github_get_workflow_run_logs`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "run_id": 123456
}
```
Response includes: `download_url`, note that you need Bearer token to download

### Repository Information

#### `github_get_repository`
```json
{
  "owner": "username",
  "repo": "repo-name"
}
```
Response includes: `name`, `full_name`, `description`, `html_url`, `private`, `default_branch`, `language`, `stargazers_count`

#### `github_list_files`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "path": "src/",
  "ref": "main"
}
```
Response includes: `count`, array of files with `name`, `path`, `type` (file|dir), `size`, `sha`

#### `github_get_file_content`
```json
{
  "owner": "username",
  "repo": "repo-name",
  "path": "README.md",
  "ref": "main"
}
```
Response includes: `name`, `path`, `size`, `sha`, `content` (decoded from base64)

## Environment Variables

- `GITHUB_TOKEN` — Personal access token (required)
- `DEBUG` — Set to 'true' for verbose logging (optional)

## Security

- **Token Protection** — Token is only used in HTTP Authorization header
- **No Logging** — Sensitive data (tokens, secrets) never logged
- **Memory Safety** — Token cleared from request after use
- **HTTPS Only** — All requests to api.github.com use HTTPS

## Limitations

### Encryption Note

The `github_set_secret` tool requires libsodium for secret encryption. If libsodium is not available, the server returns the public key and instructions for manual encryption.

To enable auto-encryption:
```bash
npm install libsodium.js
```

### Local Git Operations

The `git_push` tool is a reference implementation. In practice, `git push` runs on your local machine with git CLI. Claude Code can execute local git commands separately.

### Rate Limiting

GitHub API has rate limits:
- 60 requests/hour (unauthenticated)
- 5,000 requests/hour (authenticated)

The server doesn't implement automatic backoff; manage limits in your Claude prompts.

## Troubleshooting

### Authentication Failed
```
Error: Authentication failed
```
Check that:
1. GITHUB_TOKEN is set correctly
2. Token is not expired
3. Token has required scopes (repo, workflow, admin:repo_hook)

### Invalid Request
```
Error: Invalid Request
```
Check that the request is valid JSON-RPC 2.0 with:
- `jsonrpc: "2.0"`
- `id: <number>`
- `method: "tools/call"`
- `params.name: <tool_name>`
- `params.arguments: {...}`

### API Rate Limited
```
Error: HTTP 403
```
You've exceeded GitHub's rate limit. Wait 1 hour or use a token with higher limits.

## Integration with Claude Code

For CS2 Skin Tracker, add to your MCP configuration:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/github-mcp.js"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}
```

Then use in prompts:
```
I need to set DATABASE_URL secret in my-org/cs2-skin-tracker
```

## Contributing

To add new tools:
1. Define in `TOOLS` object with JSON schema
2. Implement handler in `toolHandlers`
3. Test with example request/response

## License

MIT
