# Codebase Guide — Safe Omada MCP

A developer map of the repository: where things live, how they connect, and how to add new functionality.

---

## Architecture Overview

```
User / Claude
     │ stdio (production)
     ▼
MCP Server (src/server/stdio.ts)
     │ filters tools via src/tools/index.ts and src/server/catalog.ts
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
- `admin`: all categories read+write except recovery
- `compatibility`: deprecated alias for `admin`; no private API fallback

`OMADA_TOOL_CATEGORIES` replaces profile defaults. Restore tools require explicit `recovery:rw`; the `all` alias excludes recovery. Writes default to previews. See [0.19 migration](docs/operations/0.19-migration.md) for dispatch, header and verification contracts.

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
    common.ts           Shared handlers, mutation results and audit logging
    catalog.ts          Effective schemas, discovery/dispatch and output redaction
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

Add the verified route to its domain class and expose it through `src/omadaClient/index.ts`. Reuse `RequestHandler.ensureSuccess` for envelopes and `fetchPaginated` for complete collections; see [site operations](src/omadaClient/site.ts). Credentials and controller identity come from configuration.

### 3. Create the tool file

Use [listSites](src/tools/listSites.ts) for a read tool and [setSwitchPorts](src/tools/setSwitchPorts.ts) for a validated mutation workflow. Register a raw Zod shape, use the common handler/result helpers, and default `dryRun` to true. Validate real response shapes rather than echoing write payloads in tests.

### 4. Register in `src/tools/index.ts`

Add the import and a `TOOL_REGISTRY` entry with category and read/write permission. Catalog registration applies the effective schema, annotations and redaction in standard and compact modes.

### 5. Write the test

Add matching operation/tool tests. Cover actual schema defaults, invalid input, preview without mutation, explicit apply, and partial/uncertain outcomes where relevant. See [MCP protocol tests](tests/integration/mcpProtocol.test.ts) for actual SDK negotiation and calls. Follow the [release validation rules](CLAUDE.md#integration-validation) before promoting writes.

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
