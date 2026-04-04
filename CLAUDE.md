# TP-Link Omada MCP Server — AI Agent Instructions

> This file is the single source of truth for AI agents working on this repository.
> For human contributors, see [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODEBASE.md](./CODEBASE.md).

## Repository Purpose

Security-focused MCP server exposing TP-Link Omada controller APIs. Written in TypeScript/Node.js. Production baseline is `stdio`; HTTP transport is in the codebase only as an explicitly unsafe, lab-only path.

## Tooling and Runtime

- Node.js 24.x — CI target and minimum runtime.
- TypeScript 5.9 — `module`/`moduleResolution`: `NodeNext`.
- Zod 3.x — config validation (MCP SDK requires Zod 3 APIs).
- Biome 2.x — linting and formatting (not ESLint/Prettier).
- Vitest 4.x — test framework.

## Environment Variables

Reference `.env.example` for the full list. All vars are loaded and validated in `src/config.ts`.

### Required

- `OMADA_BASE_URL` — controller URL (e.g. `https://omada.local`)
- `OMADA_CLIENT_ID` — OAuth2 client ID
- `OMADA_CLIENT_SECRET` — OAuth2 client secret
- `OMADA_OMADAC_ID` — controller ID

### Optional — Omada

- `OMADA_SITE_ID` — default site ID
- `OMADA_STRICT_SSL` (default: `true`) — enforce SSL certificate validation
- `OMADA_TIMEOUT` (default: `30000`) — request timeout ms
- `OMADA_CAPABILITY_PROFILE` (default: `safe-read`) — `safe-read` / `ops-write` / `admin` / `compatibility`
- `OMADA_TOOL_CATEGORIES` — explicit category override, e.g. `clients:rw,devices-all:r`

### Optional — Server

- `MCP_SERVER_LOG_LEVEL` (default: `info`) — `debug` / `info` / `warn` / `error`
- `MCP_SERVER_LOG_FORMAT` (default: `plain`) — `plain` / `json` / `gcp-json`
- `MCP_SERVER_USE_HTTP` (default: `false`) — lab-only HTTP mode
- `MCP_UNSAFE_ENABLE_HTTP` (default: `false`) — required acknowledgement for HTTP mode

### HTTP mode only (when both HTTP flags are `true`)

- `MCP_HTTP_PORT` (default: `3000`)
- `MCP_HTTP_BIND_ADDR` (default: `127.0.0.1`) — loopback only in safe baseline
- `MCP_HTTP_PATH` (default: `/mcp`)
- `MCP_HTTP_ENABLE_HEALTHCHECK` (default: `true`)
- `MCP_HTTP_HEALTHCHECK_PATH` (default: `/healthz`)
- `MCP_HTTP_ALLOW_CORS` (default: `true`)
- `MCP_HTTP_ALLOWED_ORIGINS` (default: `127.0.0.1, localhost`)
- `MCP_HTTP_NGROK_ENABLED` (default: `false`) — disabled in safe baseline

## Code Structure

```
src/
  index.ts           Startup — picks stdio or HTTP transport
  config.ts          All env var loading + Zod validation (single source of truth)
  env.ts             Raw process.env — only used by config.ts
  types.ts           Top-level shared types
  omadaClient/       Omada HTTP API layer (organized by API tag)
    index.ts         OmadaClient class
    auth.ts          OAuth2 client credentials + token caching
    request.ts       Axios base wrapper
    *.ts             Operations classes per API tag
  server/
    common.ts        Shared tool/prompt registration logic
    stdio.ts         stdio transport (production)
    http.ts          HTTP coordinator (lab-only)
    stream.ts        Streamable HTTP (MCP 2025-03-26, lab-only)
  tools/
    index.ts         Tool registration (imports all tools)
    types.ts         Shared tool-layer types
    *.ts             One file per MCP tool
  utils/
    logger.ts        Pino wrapper — use this, never console.log
    config-validations.ts  Zod validators for config values
    pagination-schema.ts   Reusable Zod schema for list args
docs/openapi/        Reference OpenAPI specs (READ ONLY)
tests/               Mirrors src/ 1:1 (enforced by CI)
OMADA_TOOLS.md       Ground-truth backlog of all 1648 API operations
CODEBASE.md          Full architecture + "how to add a tool" walkthrough
```

## Mandatory Coding Rules

### Environment Variables
- **Never** call `process.env.` outside `src/env.ts` and `src/config.ts`.
- All env vars must go through `loadConfigFromEnv()` in `src/config.ts`.

### TypeScript
- No `any` — use `unknown` and narrow with type guards or Zod.
- All imports use `.js` extension (NodeNext ESM requirement).
- Explicit return types on public functions.

### Logging
- Always use `src/utils/logger.ts`. Never `console.log`.

### Pagination
- Always reuse `src/utils/pagination-schema.ts` for list tool args.

### Formatting
- Biome handles formatting + linting. LF line endings required.
- Run `npm run format` to fix CRLF automatically.

## API Validation — MANDATORY Before Implementing Any Tool

1. **Verify the endpoint exists** in `docs/openapi/<tag>.json` before writing any code.
2. **Use `OMADA_TOOLS.md` as ground truth** — every tool there has a verified route.
3. **If not in `OMADA_TOOLS.md` and not in `docs/openapi/`** — do NOT implement it.
4. **Never infer or guess API routes** — only implement against verified spec paths.
5. **Never edit `docs/openapi/*.json`** — they are reference-only.
6. **Use individual tag files** (e.g. `03-device.json`), not `00-all.json` (too large).

## Adding a New Tool

1. Verify endpoint in `docs/openapi/<tag>.json` or `OMADA_TOOLS.md`.
2. Add method to the appropriate `src/omadaClient/<area>.ts` Operations class.
3. Expose it on `OmadaClient` in `src/omadaClient/index.ts`.
4. Create `src/tools/<toolName>.ts` following existing tool pattern.
5. Register it in `src/tools/index.ts` under the correct category block.
6. Create `tests/tools/<toolName>.test.ts` (must mirror src structure).
7. Add a row to the Supported Operations table in **both** `README.md` and `README.Docker.md`.

See `CODEBASE.md` for a detailed step-by-step with worked examples.

## Avoid Duplicate Endpoint Implementations

Before adding a new method to any `*Operations` class:

1. Search all of `src/omadaClient/` for the target API path — it may already exist.
2. If it exists elsewhere, delegate rather than re-implementing.
3. Check `src/omadaClient/index.ts` for what's already publicly exposed.

## Testing Rules

### Test structure
- Every `src/tools/<name>.ts` (except `index.ts`, `types.ts`) → must have `tests/tools/<name>.test.ts`.
- Every `src/omadaClient/<name>.ts` (except `index.ts`) → must have `tests/omadaClient/<name>.test.ts`.
- CI enforces this via `scripts/check-tool-tests.mjs`.

### Coverage thresholds

| Level | Metric | Threshold |
|---|---|---|
| Per-file | Lines, Statements, Functions | **90%** |
| Global | Branches | **70%** |

- Excluded from coverage: `src/omadaClient/index.ts`, `src/server/http.ts`, `src/server/stream.ts`, `src/omadaClient/request.ts`

### Always use `npm run test:coverage`

`npm test` does NOT enforce per-file thresholds. Use `npm run test:coverage` — always, not just in CI.

### Test requirements by tool type

| Tool type | Required tests |
|---|---|
| Read tool | Operation + tool registration |
| Low-risk write | Operation + registration + mutation summary (dry-run) |
| Admin write | Add explicit validation and conflict/error-path tests |

### When you extend an existing file

If you add methods to any `src/omadaClient/*.ts` or `src/tools/*.ts`, you **must** extend its matching test file. Coverage will fail otherwise.

## Pre-commit Checklist

All of the following must pass before committing:

```bash
npm run check                      # Biome lint + tsc --noEmit
npm run build                      # tsc → dist/
npm run test:coverage              # Vitest with 90% per-file enforcement
node scripts/check-tool-tests.mjs  # 1:1 test file mirroring
node scripts/check-readme-sync.mjs # README tool table sync
```

The husky pre-commit hook runs `test:coverage` automatically.

## Documentation Synchronization

`README.md` and `README.Docker.md` must always be updated together for:
- Tool tables (Supported Operations)
- Environment variable tables
- Transport / Quick Start sections

`README.Docker.md` excludes dev-only sections (building, linting, devcontainer).

## Deprecated Tool Convention

1. Prefix description with `[DEPRECATED]` — see `src/tools/getRFScanResult.ts` as canonical example.
2. Update **both** READMEs in the same commit.

## GitFlow Branching

| Branch type | Pattern | Base | Merges into |
|---|---|---|---|
| Feature | `feature/<description>` | `develop` | `develop` |
| Bug fix | `fix/<description>` | `develop` | `develop` |
| Release | `release/<version>` | `develop` | `develop` + `main` |
| Hotfix | `hotfix/<description>` | `main` | `main` + `develop` |

- **Never commit directly to `main` or `develop`.**
- Branch names: lowercase, hyphenated. E.g. `feature/add-backup-tools`.
- All PRs target `develop` (or `main` for hotfixes).

## Security Model

- Credentials via environment only — never as tool arguments.
- stdio is the only production-supported transport.
- Capability profiles gate which tools are exposed (`safe-read` is the default).
- No secrets in logs — values are masked before logging.
- HTTP transport requires two explicit opt-in flags and binds to loopback only.

## Integration Tests (Planned)

Not yet implemented — tracked for v1.0.0. Will run against a real Omada Software Controller in Docker. Write tools **must** be tested against the Docker controller before release — never against a production controller.

## Implementation Backlog

`OMADA_TOOLS.md` is the canonical backlog. Current state: **287/1648 operations implemented**.

Priority order for next phases:
1. `maintenance` (0/14) — reboot, backup, firmware
2. `account-users` (0/19) — user management
3. `devices-general` (11/117) — largest gap in a core category
4. `clients` writes (6/19) — block/unblock/reconnect
5. `vpn` (27/77) — VPN management
6. `profiles` (12/154) — automation workflows
7. `schedules` (0/7) — small, high value
