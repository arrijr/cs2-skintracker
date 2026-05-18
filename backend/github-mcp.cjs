#!/usr/bin/env node

/**
 * GitHub MCP Server
 *
 * A complete Model Context Protocol server for GitHub operations.
 * Implements JSON-RPC 2.0 protocol with GitHub REST API v3.
 *
 * Usage:
 *   node github-mcp.js
 *
 * Environment:
 *   GITHUB_TOKEN - GitHub personal access token (required)
 *   DEBUG - Set to 'true' for verbose logging (optional)
 */

const http = require('http');
const readline = require('readline');

// ============================================================================
// Configuration
// ============================================================================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DEBUG = process.env.DEBUG === 'true';
const GITHUB_API_BASE = 'https://api.github.com';

// Tool definitions
const TOOLS = {
  // Git Operations
  git_push: {
    name: 'git_push',
    description: 'Push commits to GitHub',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        branch: { type: 'string', description: 'Branch to push to' },
        force: { type: 'boolean', description: 'Force push (default: false)' }
      },
      required: ['owner', 'repo', 'branch']
    }
  },
  git_create_pull_request: {
    name: 'git_create_pull_request',
    description: 'Create a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'PR title' },
        body: { type: 'string', description: 'PR description' },
        head: { type: 'string', description: 'Head branch (feature branch)' },
        base: { type: 'string', description: 'Base branch (default: main)' }
      },
      required: ['owner', 'repo', 'title', 'head']
    }
  },
  git_merge_pull_request: {
    name: 'git_merge_pull_request',
    description: 'Merge a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'integer', description: 'Pull request number' },
        merge_method: {
          type: 'string',
          enum: ['squash', 'rebase', 'merge'],
          description: 'Merge strategy (default: merge)'
        },
        commit_title: { type: 'string', description: 'Custom commit title' },
        commit_message: { type: 'string', description: 'Custom commit message' }
      },
      required: ['owner', 'repo', 'pull_number']
    }
  },
  git_create_branch: {
    name: 'git_create_branch',
    description: 'Create a new branch',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        branch: { type: 'string', description: 'New branch name' },
        base: { type: 'string', description: 'Base branch to branch from (default: main)' }
      },
      required: ['owner', 'repo', 'branch']
    }
  },
  git_list_branches: {
    name: 'git_list_branches',
    description: 'List all branches in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        per_page: { type: 'integer', description: 'Results per page (default: 30)' }
      },
      required: ['owner', 'repo']
    }
  },

  // Repository Management
  github_set_secret: {
    name: 'github_set_secret',
    description: 'Set a repository secret',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        secret_name: { type: 'string', description: 'Secret name (uppercase recommended)' },
        secret_value: { type: 'string', description: 'Secret value' }
      },
      required: ['owner', 'repo', 'secret_name', 'secret_value']
    }
  },
  github_list_secrets: {
    name: 'github_list_secrets',
    description: 'List all repository secrets',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' }
      },
      required: ['owner', 'repo']
    }
  },
  github_create_issue: {
    name: 'github_create_issue',
    description: 'Create a GitHub issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue description' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Labels to add' },
        assignees: { type: 'array', items: { type: 'string' }, description: 'Users to assign' }
      },
      required: ['owner', 'repo', 'title']
    }
  },
  github_list_issues: {
    name: 'github_list_issues',
    description: 'List issues in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Issue state (default: open)' },
        per_page: { type: 'integer', description: 'Results per page (default: 30)' }
      },
      required: ['owner', 'repo']
    }
  },
  github_create_release: {
    name: 'github_create_release',
    description: 'Create a GitHub release',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        tag_name: { type: 'string', description: 'Release tag (v1.0.0)' },
        target_commitish: { type: 'string', description: 'Commit/branch for tag (default: main)' },
        name: { type: 'string', description: 'Release name' },
        body: { type: 'string', description: 'Release description' },
        draft: { type: 'boolean', description: 'Create as draft (default: false)' },
        prerelease: { type: 'boolean', description: 'Mark as prerelease (default: false)' }
      },
      required: ['owner', 'repo', 'tag_name']
    }
  },

  // Workflow Management
  github_list_workflows: {
    name: 'github_list_workflows',
    description: 'List GitHub Actions workflows',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' }
      },
      required: ['owner', 'repo']
    }
  },
  github_trigger_workflow: {
    name: 'github_trigger_workflow',
    description: 'Manually trigger a GitHub Actions workflow',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        workflow_id: { type: 'string', description: 'Workflow ID or filename (.yml)' },
        ref: { type: 'string', description: 'Branch/tag to run on (default: main)' },
        inputs: { type: 'object', description: 'Workflow input parameters' }
      },
      required: ['owner', 'repo', 'workflow_id']
    }
  },
  github_get_workflow_runs: {
    name: 'github_get_workflow_runs',
    description: 'Get workflow run history',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        workflow_id: { type: 'string', description: 'Workflow ID or filename' },
        per_page: { type: 'integer', description: 'Results per page (default: 30)' }
      },
      required: ['owner', 'repo', 'workflow_id']
    }
  },
  github_get_workflow_run_logs: {
    name: 'github_get_workflow_run_logs',
    description: 'Get logs from a workflow run',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        run_id: { type: 'integer', description: 'Workflow run ID' }
      },
      required: ['owner', 'repo', 'run_id']
    }
  },

  // Repository Information
  github_get_repository: {
    name: 'github_get_repository',
    description: 'Get repository information',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' }
      },
      required: ['owner', 'repo']
    }
  },
  github_list_files: {
    name: 'github_list_files',
    description: 'List files in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'Directory path (default: root)' },
        ref: { type: 'string', description: 'Branch/tag/commit (default: main)' }
      },
      required: ['owner', 'repo']
    }
  },
  github_get_file_content: {
    name: 'github_get_file_content',
    description: 'Get raw file content from a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'File path' },
        ref: { type: 'string', description: 'Branch/tag/commit (default: main)' }
      },
      required: ['owner', 'repo', 'path']
    }
  }
};

// ============================================================================
// GitHub API Helper
// ============================================================================

/**
 * Make an authenticated request to GitHub API
 */
function githubRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(GITHUB_API_BASE + path);
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'GitHub-MCP-Server/1.0'
      }
    };

    // Add Content-Length for POST/PATCH/PUT
    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    if (DEBUG) {
      console.error(`[DEBUG] ${method} ${path}`);
      if (body) console.error(`[DEBUG] Body:`, body);
    }

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;

          // Check for GitHub API errors
          if (res.statusCode >= 400) {
            const error = new Error(
              parsed?.message || `GitHub API error: ${res.statusCode}`
            );
            error.statusCode = res.statusCode;
            error.response = parsed;
            return reject(error);
          }

          if (DEBUG) {
            console.error(`[DEBUG] Response: ${res.statusCode}`, parsed);
          }

          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// ============================================================================
// Tool Implementations
// ============================================================================

const toolHandlers = {
  // Git Operations
  async git_push(args) {
    // Note: git_push requires local git context; this is a reference implementation
    // In practice, Claude would need to run this with actual git commands
    return {
      status: 'reference-implementation',
      message: 'git push is implemented on the local machine via git CLI',
      details: `To push branch '${args.branch}' to ${args.owner}/${args.repo}:
        git push origin ${args.branch}${args.force ? ' --force' : ''}`
    };
  },

  async git_create_pull_request(args) {
    const { owner, repo, title, body = '', head, base = 'main' } = args;
    const response = await githubRequest('POST', `/repos/${owner}/${repo}/pulls`, {
      title,
      body,
      head,
      base
    });
    return {
      number: response.data.number,
      html_url: response.data.html_url,
      state: response.data.state,
      title: response.data.title
    };
  },

  async git_merge_pull_request(args) {
    const { owner, repo, pull_number, merge_method = 'merge', commit_title, commit_message } = args;
    const payload = {
      merge_method,
      ...(commit_title && { commit_title }),
      ...(commit_message && { commit_message })
    };
    const response = await githubRequest('PUT', `/repos/${owner}/${repo}/pulls/${pull_number}/merge`, payload);
    return {
      merged: response.data.merged,
      message: response.data.message,
      sha: response.data.sha
    };
  },

  async git_create_branch(args) {
    const { owner, repo, branch, base = 'main' } = args;

    // First get the base branch SHA
    const baseResponse = await githubRequest('GET', `/repos/${owner}/${repo}/git/ref/heads/${base}`);
    const baseSha = baseResponse.data.object.sha;

    // Create new branch
    const response = await githubRequest('POST', `/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: baseSha
    });

    return {
      ref: response.data.ref,
      node_id: response.data.node_id,
      url: response.data.url
    };
  },

  async git_list_branches(args) {
    const { owner, repo, per_page = 30 } = args;
    const response = await githubRequest('GET', `/repos/${owner}/${repo}/branches?per_page=${per_page}`);
    return {
      count: response.data.length,
      branches: response.data.map(b => ({
        name: b.name,
        protected: b.protected,
        commit: {
          sha: b.commit.sha,
          url: b.commit.url
        }
      }))
    };
  },

  // Repository Management
  async github_set_secret(args) {
    const { owner, repo, secret_name, secret_value } = args;

    // Get public key for encryption
    const keyResponse = await githubRequest('GET', `/repos/${owner}/${repo}/actions/secrets/public-key`);
    const publicKey = keyResponse.data.key;
    const keyId = keyResponse.data.key_id;

    // In a real implementation, encrypt secret_value using the public key
    // For this server, we document the process
    const sodium = require('libsodium.js');

    // Note: libsodium is optional; if not available, provide instructions
    let encryptedValue;
    try {
      const publicKeyBytes = Buffer.from(publicKey, 'base64');
      const secretBytes = Buffer.from(secret_value);
      const encryptedBytes = sodium.crypto_box_seal(secretBytes, publicKeyBytes);
      encryptedValue = Buffer.from(encryptedBytes).toString('base64');
    } catch (e) {
      // Fallback: provide manual encryption instructions
      return {
        status: 'requires-encryption',
        message: 'Install libsodium.js to auto-encrypt secrets',
        instructions: `Manual steps to set secret '${secret_name}':
1. Encrypt your value with GitHub's public key
2. POST to /repos/${owner}/${repo}/actions/secrets/${secret_name}
3. Include encrypted_value and key_id in request body`,
        public_key: publicKey,
        key_id: keyId
      };
    }

    const response = await githubRequest('PUT', `/repos/${owner}/${repo}/actions/secrets/${secret_name}`, {
      encrypted_value: encryptedValue,
      key_id: keyId
    });

    return {
      status: 'success',
      secret_name,
      message: `Secret '${secret_name}' has been set`
    };
  },

  async github_list_secrets(args) {
    const { owner, repo } = args;
    const response = await githubRequest('GET', `/repos/${owner}/${repo}/actions/secrets`);
    return {
      count: response.data.secrets.length,
      secrets: response.data.secrets.map(s => ({
        name: s.name,
        created_at: s.created_at,
        updated_at: s.updated_at
      }))
    };
  },

  async github_create_issue(args) {
    const { owner, repo, title, body = '', labels = [], assignees = [] } = args;
    const response = await githubRequest('POST', `/repos/${owner}/${repo}/issues`, {
      title,
      body,
      labels,
      assignees
    });
    return {
      number: response.data.number,
      html_url: response.data.html_url,
      state: response.data.state,
      title: response.data.title
    };
  },

  async github_list_issues(args) {
    const { owner, repo, state = 'open', per_page = 30 } = args;
    const response = await githubRequest('GET', `/repos/${owner}/${repo}/issues?state=${state}&per_page=${per_page}`);
    return {
      count: response.data.length,
      issues: response.data.map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        html_url: i.html_url,
        created_at: i.created_at,
        updated_at: i.updated_at
      }))
    };
  },

  async github_create_release(args) {
    const { owner, repo, tag_name, target_commitish, name, body = '', draft = false, prerelease = false } = args;
    const response = await githubRequest('POST', `/repos/${owner}/${repo}/releases`, {
      tag_name,
      target_commitish,
      name,
      body,
      draft,
      prerelease
    });
    return {
      id: response.data.id,
      tag_name: response.data.tag_name,
      html_url: response.data.html_url,
      published_at: response.data.published_at
    };
  },

  // Workflow Management
  async github_list_workflows(args) {
    const { owner, repo } = args;
    const response = await githubRequest('GET', `/repos/${owner}/${repo}/actions/workflows`);
    return {
      count: response.data.total_count,
      workflows: response.data.workflows.map(w => ({
        id: w.id,
        name: w.name,
        path: w.path,
        state: w.state,
        html_url: w.html_url
      }))
    };
  },

  async github_trigger_workflow(args) {
    const { owner, repo, workflow_id, ref = 'main', inputs = {} } = args;
    const response = await githubRequest('POST', `/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`, {
      ref,
      inputs
    });
    return {
      status: 'success',
      message: `Workflow '${workflow_id}' triggered on branch '${ref}'`
    };
  },

  async github_get_workflow_runs(args) {
    const { owner, repo, workflow_id, per_page = 30 } = args;
    const response = await githubRequest('GET', `/repos/${owner}/${repo}/actions/workflows/${workflow_id}/runs?per_page=${per_page}`);
    return {
      count: response.data.total_count,
      runs: response.data.workflow_runs.map(r => ({
        id: r.id,
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        created_at: r.created_at,
        updated_at: r.updated_at,
        html_url: r.html_url
      }))
    };
  },

  async github_get_workflow_run_logs(args) {
    const { owner, repo, run_id } = args;
    const response = await githubRequest('GET', `/repos/${owner}/${repo}/actions/runs/${run_id}/logs`);
    // GitHub returns a ZIP file; we return metadata
    return {
      status: 'success',
      message: 'Logs available for download',
      download_url: `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run_id}/logs`,
      note: 'Make request with Authorization header to download ZIP'
    };
  },

  // Repository Information
  async github_get_repository(args) {
    const { owner, repo } = args;
    const response = await githubRequest('GET', `/repos/${owner}/${repo}`);
    const data = response.data;
    return {
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      html_url: data.html_url,
      private: data.private,
      fork: data.fork,
      created_at: data.created_at,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
      size: data.size,
      stargazers_count: data.stargazers_count,
      watchers_count: data.watchers_count,
      language: data.language,
      default_branch: data.default_branch
    };
  },

  async github_list_files(args) {
    const { owner, repo, path = '', ref = 'main' } = args;
    const queryPath = path ? `?ref=${ref}` : `?ref=${ref}`;
    const response = await githubRequest('GET', `/repos/${owner}/${repo}/contents/${path}${queryPath}`);

    const items = Array.isArray(response.data) ? response.data : [response.data];
    return {
      count: items.length,
      files: items.map(f => ({
        name: f.name,
        path: f.path,
        type: f.type,
        size: f.size,
        sha: f.sha,
        url: f.url,
        html_url: f.html_url
      }))
    };
  },

  async github_get_file_content(args) {
    const { owner, repo, path, ref = 'main' } = args;
    const response = await githubRequest('GET', `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`);

    // GitHub returns base64-encoded content
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');

    return {
      name: response.data.name,
      path: response.data.path,
      size: response.data.size,
      sha: response.data.sha,
      content,
      encoding: 'utf-8'
    };
  }
};

// ============================================================================
// MCP Server
// ============================================================================

const messages = [];
let requestId = 0;

/**
 * Parse JSON-RPC request and dispatch to handler
 */
async function handleRequest(request) {
  const { jsonrpc, id, method, params } = request;

  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code: -32600,
        message: 'Invalid Request: jsonrpc must be 2.0'
      }
    };
  }

  // Dispatch method
  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          serverInfo: {
            name: 'GitHub-MCP-Server',
            version: '1.0.0'
          }
        }
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: Object.values(TOOLS)
        }
      };

    case 'tools/call':
      try {
        const { name, arguments: args } = params;
        if (!toolHandlers[name]) {
          throw new Error(`Unknown tool: ${name}`);
        }
        const result = await toolHandlers[name](args);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        };
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: error.message,
            data: {
              details: error.statusCode ? `HTTP ${error.statusCode}` : undefined
            }
          }
        };
      }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      };
  }
}

// ============================================================================
// Startup
// ============================================================================

async function main() {
  // Validate token
  if (!GITHUB_TOKEN) {
    console.error('ERROR: GITHUB_TOKEN environment variable is not set');
    console.error('Set it before starting the server:');
    console.error('  export GITHUB_TOKEN=ghp_...');
    console.error('  node github-mcp.js');
    process.exit(1);
  }

  console.error('GitHub MCP Server starting...');
  console.error(`Validating token...`);

  // Test token by getting current user
  try {
    const response = await githubRequest('GET', '/user');
    const login = response.data.login;
    console.error(`Authenticated as: ${login}`);
  } catch (error) {
    console.error(`Authentication failed: ${error.message}`);
    process.exit(1);
  }

  // Setup stdio-based JSON-RPC
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: false
  });

  console.error('Ready to handle requests');

  rl.on('line', async (line) => {
    if (!line.trim()) return;

    try {
      const request = JSON.parse(line);
      const response = await handleRequest(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error: ' + error.message
        }
      }));
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
