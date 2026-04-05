# Codebase Guide — Safe Omada MCP

A developer map of the repository: where things live, how they connect, and how to add new functionality.

---

## Architecture Overview

```
User / Claude
     │ stdio (production)
     ▼
MCP Server (src/server/stdio.ts)
     │ registers tools via src/server/common.ts
     ▼
Tool handlers (src/tools/*.ts)
     │ call
     ▼
OmadaClient (src/omadaClient/index.ts)
     │ OAuth2 client credentials → Omada Controller HTTP API
     ▼
TP-Link Omada Controller
```

**Transport selection** happens at startup in `src/index.ts`:
- Default: `stdio` — the only production-supported path.
- Lab-only: HTTP (requires two explicit env vars to unlock: `MCP_SERVER_USE_HTTP=true` + `MCP_UNSAFE_ENABLE_HTTP=true`).

**Tool gating** is controlled by `OMADA_CAPABILITY_PROFILE` and `OMADA_TOOL_CATEGORIES`:
- `safe-read` (default): read-only tools for dashboard, clients, devices
- `ops-write`: adds write tools for clients and maintenance
- `admin`: all categories read+write
- `compatibility`: reserved for future controller-specific fallback

---

## Directory Map

```
src/
  index.ts              Startup — reads config, picks transport, starts server
  config.ts             All env var loading and Zod validation (single source of truth)
  env.ts                Raw process.env access — only used by config.ts
  types.ts              Top-level shared types

  omadaClient/          Omada HTTP API layer
    index.ts            OmadaClient class — delegates to Operations classes
    auth.ts             OAuth2 client credentials flow + token caching
    request.ts          Axios base wrapper (GET/POST/PATCH/DELETE)
    client.ts           Client-related API calls
    device.ts           Device API calls
    network.ts          Network API calls
    security.ts         Security API calls
    site.ts             Site API calls
    account.ts          Account/user API calls
    actions.ts          Action API calls
    controller.ts       Controller API calls
    insight.ts          Insight API calls
    log.ts              Log API calls
    maintenance.ts      Maintenance API calls
    monitor.ts          Monitor API calls
    schedules.ts        Schedule API calls

  server/               MCP transport implementations
    common.ts           Tool + prompt registration, shared handler logic
    stdio.ts            stdio transport (production)
    http.ts             HTTP coordinator (lab-only)
    stream.ts           Streamable HTTP transport (MCP 2025-03-26, lab-only)

  tools/                One file per MCP tool
    index.ts            Tool registration — imports and registers all tools
    types.ts            Shared tool-layer types
    <toolName>.ts       Individual tool implementation

  types/                Centralized API response type definitions
    index.ts            Re-exports all types

  utils/
    logger.ts           Pino logger wrapper — use this everywhere
    config-validations.ts  Zod validators for config values
    pagination-schema.ts   Reusable Zod schema for paginated list args

docs/
  openapi/              Reference OpenAPI specs (READ ONLY — do not edit)
    00-all.json         Full spec — too large to use directly
    01-account.json     Per-tag spec files (use these instead of 00-all.json)
    ...
  architecture.md       Architectural decisions
  decision-log/         ADRs (Architecture Decision Records)
  implementation-playbook.md  Rules for implementing new tools
  security-model.md     Security design documentation
  operator-guide.md     Production deployment guide

tests/                  Mirrors src/ structure exactly (1:1 file matching enforced)
  tools/                tests/tools/<name>.test.ts for every src/tools/<name>.ts
  omadaClient/          tests/omadaClient/<name>.test.ts for every src/omadaClient/<name>.ts
  server/               Server transport tests
  utils/                Utility function tests
  config.test.ts        Config loading and validation tests
  index.test.ts         Startup / transport selection tests

scripts/
  check-tool-tests.mjs   CI: enforces 1:1 src/tests file mirroring
  check-readme-sync.mjs  CI: verifies all tools appear in README tables
  run-inspector.ts       Launches MCP inspector for local testing

OMADA_TOOLS.md          Ground-truth backlog of all 1648 Omada API operations
                        with implementation status (use as the feature backlog)
```

---

## Adding a New Tool — Step by Step

Use `src/tools/getClient.ts` as a reference for a simple read tool.

### 1. Verify the endpoint

Check `OMADA_TOOLS.md` for the operation. Find its `OpenAPI File` and `JSON Path Locator` columns, then confirm the endpoint exists in the corresponding `docs/openapi/<tag>.json`. Never guess a route.

### 2. Add the method to the Operations class

If the endpoint belongs to a new area, add a method to the appropriate `src/omadaClient/<area>.ts` file. Example:

```typescript
// src/omadaClient/maintenance.ts
async getBackupList(omadacId: string, siteId: string): Promise<BackupFile[]> {
    const resp = await this.request.get<OmadaApiResponse<{ data: BackupFile[] }>>(
        `/openapi/v1/${omadacId}/sites/${siteId}/cmd/backup/files`
    );
    return resp.data.result.data;
}
```

Expose it on `OmadaClient` in `src/omadaClient/index.ts`.

### 3. Create the tool file

```typescript
// src/tools/getBackupList.ts
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { logger } from '../utils/logger.js';

export function registerGetBackupList(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getBackupList',
        {
            description: 'List backup files for a site',
            inputSchema: z.object({
                omadacId: z.string().describe('Omada controller ID'),
                siteId: z.string().describe('Site ID'),
            }),
            // category and permission used by capability gating in index.ts
        },
        async (args) => {
            try {
                const files = await client.getBackupList(args.omadacId, args.siteId);
                return { content: [{ type: 'text', text: JSON.stringify(files, null, 2) }] };
            } catch (error) {
                logger.error('getBackupList failed', { error });
                throw error;
            }
        }
    );
}
```

### 4. Register in `src/tools/index.ts`

Find the appropriate category block and add your import + registration call, following the exact pattern of adjacent tools.

### 5. Write the test

Create `tests/tools/getBackupList.test.ts`. Pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerGetBackupList } from '../../src/tools/getBackupList.js';

describe('getBackupList', () => {
    // mock server + client, capture handler, assert correct call
});
```

See `tests/tools/getClient.test.ts` for a complete example.

### 6. Update documentation

Add a row to the Supported Operations table in **both** `README.md` and `README.Docker.md`.

---

## Configuration Reference

All env vars are loaded in `src/config.ts` via Zod. Never call `process.env` directly elsewhere.

### Required

| Variable | Description |
|---|---|
| `OMADA_BASE_URL` | Controller URL, e.g. `https://omada.local` |
| `OMADA_CLIENT_ID` | OAuth2 client ID |
| `OMADA_CLIENT_SECRET` | OAuth2 client secret |
| `OMADA_OMADAC_ID` | Controller ID (omadacId) |

### Optional — Omada

| Variable | Default | Description |
|---|---|---|
| `OMADA_SITE_ID` | — | Default site ID |
| `OMADA_STRICT_SSL` | `true` | Enforce SSL certificate validation |
| `OMADA_TIMEOUT` | `30000` | Request timeout (ms) |
| `OMADA_CAPABILITY_PROFILE` | `safe-read` | `safe-read` / `ops-write` / `admin` / `compatibility` |
| `OMADA_TOOL_CATEGORIES` | (from profile) | Explicit category override, e.g. `clients:rw,devices-all:r` |

### Optional — Server

| Variable | Default | Description |
|---|---|---|
| `MCP_SERVER_LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `MCP_SERVER_LOG_FORMAT` | `plain` | `plain` / `json` / `gcp-json` |
| `MCP_SERVER_USE_HTTP` | `false` | Lab-only: enable HTTP transport |
| `MCP_UNSAFE_ENABLE_HTTP` | `false` | Required acknowledgement for HTTP mode |

---

## Development Workflow

```bash
npm ci                   # install dependencies
npm run dev              # run with tsx hot-reload (set env vars first)
npm run build            # compile TypeScript → dist/
npm run check            # Biome lint + tsc --noEmit
npm run test:coverage    # Vitest + per-file 90% coverage enforcement
npm run inspector        # launch MCP inspector UI
```

---

## API Spec Navigation

- `OMADA_TOOLS.md` — the implementation backlog. 1648 operations with status (`✅` / `⬜`), category, HTTP method, API path, and OpenAPI file reference.
- `docs/openapi/` — per-tag OpenAPI JSON files. Use the individual tag files (e.g., `03-device.json`), not `00-all.json` (too large).
- Cross-reference: find an unimplemented tool in `OMADA_TOOLS.md`, note its `OpenAPI File`, open that file, navigate with the `JSON Path Locator` value.

---

## Key Invariants

- All imports use `.js` extension (NodeNext ESM).
- No `any` — use `unknown` + type guards.
- No `console.log` — use `src/utils/logger.ts`.
- No `process.env` outside `src/config.ts`.
- Every `src/tools/<name>.ts` must have `tests/tools/<name>.test.ts`.
- Every `src/omadaClient/<name>.ts` (except `index.ts`) must have `tests/omadaClient/<name>.test.ts`.
- Both `README.md` and `README.Docker.md` must be updated together for any tool or env var change.
