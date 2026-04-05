# Contributing to Safe Omada MCP

Thanks for your interest in contributing. This guide covers everything you need to go from zero to a merged pull request.

## Prerequisites

- Node.js 24.x
- npm 10+
- A TP-Link Omada controller (hardware or software) for manual testing (optional but recommended for write tools)

## Getting Started

```bash
git clone https://github.com/gaspareduard/Omada-mcp.git
cd Omada-mcp
npm ci
cp .env.example .env.local   # fill in your controller credentials
npm run dev                  # starts the server with tsx hot-reload
```

To launch the MCP inspector for interactive testing:

```bash
npm run inspector
```

## Branching Strategy (GitFlow)

| Branch type | Pattern | Base | Merges into |
|---|---|---|---|
| Feature | `feature/<description>` | `develop` | `develop` |
| Bug fix | `fix/<description>` | `develop` | `develop` |
| Release | `release/<version>` | `develop` | `develop` + `main` |
| Hotfix | `hotfix/<description>` | `main` | `main` + `develop` |

- **Never commit directly to `main` or `develop`.**
- Keep branch names lowercase and hyphenated: `feature/add-site-list`, `fix/ssl-timeout`.

```bash
git checkout develop && git pull
git checkout -b feature/<your-description>
# make changes, commit
git push -u origin feature/<your-description>
# open PR targeting develop
```

## Adding a New Tool

See [CODEBASE.md](./CODEBASE.md) for the full walkthrough. Quick checklist:

1. Verify the endpoint exists in `docs/openapi/<tag>.json` or `OMADA_TOOLS.md`.
2. Create `src/tools/<toolName>.ts` following the existing pattern.
3. Register it in `src/tools/index.ts`.
4. Create `tests/tools/<toolName>.test.ts` (must mirror the src file).
5. Add a row to the Supported Operations table in **both** `README.md` and `README.Docker.md`.

> Never infer or guess API routes. Only implement against paths verified in `docs/openapi/`.

## Pre-commit Checklist

All of the following must pass before you push:

```bash
npm run check          # Biome lint + tsc --noEmit
npm run build          # tsc → dist/
npm run test:coverage  # Vitest with per-file 90% threshold enforcement
node scripts/check-tool-tests.mjs    # 1:1 test file mirroring check
node scripts/check-readme-sync.mjs  # README tool table sync check
```

> Use `npm run test:coverage`, NOT `npm test`. Only `test:coverage` enforces per-file thresholds.

## Code Style

- **Formatter/linter:** Biome (`npm run format` + `npm run lint`)
- **Line endings:** LF only — run `npm run format` to fix CRLF automatically
- **No `any`:** use `unknown` and narrow with type guards or Zod
- **No `process.env` outside `src/config.ts`** — all env vars must go through `loadConfigFromEnv()`
- **Logging:** always use `src/utils/logger.ts`, never `console.log`
- **Pagination:** reuse `src/utils/pagination-schema.ts` for all list tools

## Test Requirements

| Tool type | Required tests |
|---|---|
| Read tool | Operation + tool registration |
| Low-risk write | Operation + registration + mutation summary (dry-run) |
| Admin write | Add explicit validation and conflict/error-path tests |

Coverage thresholds: **90% lines/statements/functions per file**, **70% branches globally**.

## Deprecated Tools

When marking a tool as deprecated:

1. Prefix the description with `[DEPRECATED]` — see `src/tools/getRFScanResult.ts` as the canonical example.
2. Update both `README.md` and `README.Docker.md` in the same commit.

## Documentation Sync

`README.md` and `README.Docker.md` must always be in sync for: tool tables, env var tables, transport info, and Quick Start. `README.Docker.md` excludes development sections (building, linting, devcontainer).

## Reporting Issues

Use GitHub Issues with the provided templates:
- **Bug report** — include controller version, OS, log output (redacted credentials), and env config
- **Feature request** — include the Omada API endpoint path from `OMADA_TOOLS.md`

## Security Vulnerabilities

Do **not** open a public issue for security vulnerabilities. See [SECURITY.md](./SECURITY.md).
