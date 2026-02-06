# OctoCAT Supply Chain – API Repository Instructions

This repository is the **Express.js + SQLite** REST API for the OctoCAT Supply Chain Management application, part of the `octocat-supply-platform` ecosystem.

## Tech Stack

- **Framework:** Express.js with TypeScript
- **Database:** SQLite (file-based `api/data/app.db`; in-memory for tests)
- **Pattern:** Repository classes for data access
- **Documentation:** Swagger/OpenAPI via JSDoc comments on routes
- **Entities:** Supplier, Product, Order, OrderDetail, Delivery, OrderDetailDelivery, Headquarters, Branch
- **Naming:** camelCase in TypeScript models, snake_case in SQL columns

## Multi-Repo Workflow

When assigned an issue that references `octocat-supply-platform#<number>`:

1. This issue was spawned by the orchestrator in the master repo
2. Implement the required changes following the task description
3. Use the `report-to-master` skill to create properly linked PRs
4. The master issue will be automatically updated with your progress

## PR Conventions

- **Title Format:** `[octocat-supply-platform#<issue>] <description>`
- **Always link** to both the master issue and local issue
- **Include integration notes** if your changes depend on other repos

## GitHub MCP Server Setup (Required for Cross-Repo Reporting)

The `report-to-master` skill requires the GitHub MCP Server so Copilot coding agent can comment on issues in the master `octocat-supply-platform` repo.

### Setup Steps

| Step | Action |
|------|--------|
| 1 | Go to **Settings → Copilot → Coding agent → MCP configuration** and add the GitHub MCP server JSON config (see below) |
| 2 | Use `https://api.githubcopilot.com/mcp` as the server URL (not `/readonly`) for write access |
| 3 | Include `issues` in the `X-MCP-Toolsets` header so the agent can comment on and create issues |
| 4 | Add a GitHub PAT as `COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN` in the repo's **Copilot environment secrets** |
| 5 | Instruct the agent in your issue to report back to the master repo when done |

### MCP Configuration JSON

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp",
      "headers": {
        "X-MCP-Toolsets": "issues"
      }
    }
  }
}
```

### PAT Scopes Required

The PAT stored in `COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN` needs:
- `repo` — full control of private repositories (or `public_repo` for public-only)
- `issues:write` — create/update issues and comments across repos

> **Note:** Without this setup, the `report-to-master` skill will not be able to comment on the master issue in `octocat-supply-platform`.

## API Guidelines

- Thin routes → logic in repository classes
- Parameterized SQL always; never interpolate user input
- Custom error classes (NotFound, Validation, Conflict) → consistent HTTP status codes
- New schema changes require sequential migration files; never edit prior migrations
- Update Swagger docs when adding/modifying endpoints
- Unit tests for repository methods; integration tests for routes (supertest)

## Build & Dev

```bash
npm install
npm run dev          # Express dev server with ts-node
npm run build        # TypeScript compilation
npm run test         # Vitest
npm run lint         # ESLint
```

## Architecture Reference

For architecture context, refer to:
- `your-org/octocat-supply-platform/architecture/`
- `your-org/octocat-supply-platform/specs/`
- `your-org/octocat-supply-platform/docs/sqlite-integration.md`
