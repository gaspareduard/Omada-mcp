# TP-Link Omada MCP Server - Developer Instructions

## Repository Purpose

This project implements a Model Context Protocol (MCP) server that exposes TP-Link Omada controller APIs. The server is written in TypeScript/Node.js. The supported production baseline is `stdio`; the legacy HTTP/Streamable HTTP transport remains in the codebase only as an explicitly unsafe, lab-only path.

## Tooling and Runtime

- Node.js 24.x is the active runtime and CI target.
- TypeScript 5.9 with `module`/`moduleResolution` set to `NodeNext`.
- Zod 3.x for configuration validation (the MCP SDK currently expects Zod 3 APIs).
- Biome 2.x for linting and formatting.

## Environment Variables

Reference `.env.example`. Primary variables:

### Omada Client Configuration:

- `OMADA_BASE_URL` (required) - base URL of the Omada controller (e.g., `https://omada-controller.local`).
- `OMADA_CLIENT_ID` (required) - client ID for OAuth2 access.
- `OMADA_CLIENT_SECRET` (required) - client secret for OAuth2 access.
- `OMADA_OMADAC_ID` (required) - Omada controller ID (omadacId) to target.
- `OMADA_SITE_ID` (optional) - site ID for the Omada controller.
- `OMADA_STRICT_SSL` (default: `true`) - whether to enforce strict SSL certificate validation.
- `OMADA_TIMEOUT` (default: `30000`) - request timeout in milliseconds.

### MCP Generic Server Configuration:

- `MCP_SERVER_LOG_LEVEL` (default: `info`) - logging verbosity (`debug`, `info`, `warn`, `error`, `silent`).
- `MCP_SERVER_LOG_FORMAT` (default: `plain`) - log output format (`plain`,`json`, or `gcp-json`).
  - `plain` - human-readable text format.
  - `json` - structured JSON format.
  - `gcp-json` - structured JSON format compatible with Google Cloud Logging.
- `OMADA_CAPABILITY_PROFILE` (default: `safe-read`) - built-in capability profile (`safe-read`, `ops-write`, `admin`, `compatibility`).
- `OMADA_TOOL_CATEGORIES` (optional) - explicit category override for tool exposure. If omitted, the selected capability profile provides the defaults.
- `MCP_SERVER_USE_HTTP` (default: `false`) - legacy lab-only switch to start the HTTP server instead of stdio.
- `MCP_UNSAFE_ENABLE_HTTP` (default: `false`) - explicit acknowledgement required before `MCP_SERVER_USE_HTTP=true` is allowed.

### MCP Server HTTP Configuration, if `MCP_SERVER_USE_HTTP=true` and `MCP_UNSAFE_ENABLE_HTTP=true`:

- `MCP_HTTP_PORT` (default: `3000`) - port for the HTTP server.
- `MCP_HTTP_BIND_ADDR` (default: `127.0.0.1`) - loopback bind address for the HTTP server. The safe baseline only allows `127.0.0.1` or `::1`.
- `MCP_HTTP_PATH` (default: `/mcp`) - base path for MCP HTTP endpoints.
- `MCP_HTTP_ENABLE_HEALTHCHECK` (default: `true`) - enable a healthcheck endpoint at the path indicated on `MCP_HTTP_HEALTHCHECK_PATH`.
- `MCP_HTTP_HEALTHCHECK_PATH` (default: `/healthz`) - path for the healthcheck endpoint.
- `MCP_HTTP_ALLOW_CORS` (default: `true`) - enable CORS for the HTTP server.
- `MCP_HTTP_ALLOWED_ORIGINS` (default: `127.0.0.1, localhost`) - comma-separated list of allowed origins for DNS rebinding protection. Must contain valid hostnames, IPv4, IPv6 addresses, or `*` to allow all origins (development only).
- `MCP_HTTP_NGROK_ENABLED` (default: `false`) - legacy placeholder. Public tunnel support is intentionally disabled in the safe baseline.
- `MCP_HTTP_NGROK_AUTH_TOKEN` (optional) - legacy placeholder.

## Code Structure

- `src/index.ts` — MCP Server startup. The supported path is stdio; HTTP startup remains gated behind explicit unsafe configuration.
- `src/config.ts` — Environment variable loading and validation via Zod.
- `src/utils/` — Utility functions (e.g., logger, error handling).
- `src/omadaClient/` — Omada API interaction layer, organized by API tag (e.g., `src/omadaClient/user.ts`, `src/omadaClient/device.ts`). The main client class is in `src/omadaClient/index.ts`.
- `src/server/` — Code for each implementation of the MCP server:
  - `src/server/stdio.ts` - stdio transport implementation
  - `src/server/http.ts` - HTTP server coordinator
  - `src/server/stream.ts` - Streamable HTTP transport implementation (MCP 2025-03-26)
  - `src/server/common.ts` - common server logic shared across transports
- `src/types/` - centralized type definitions (API, MCP, errors)
- `src/tools/` - individual tool files and registration.
- `src/prompts/` - individual prompt files and registration.
- `docs/openapi/` — Reference OpenAPI specifications for Omada endpoints, split per API tag.
- `tests/` — Unit and integration tests. **The test folder structure MUST mirror the src folder structure.** For example:
  - `tests/utils/config-validations.test.ts` tests `src/utils/config-validations.ts`
  - `tests/server/http.test.ts` would test `src/server/http.ts`

## Testing

### Unit Tests

- The project uses **Vitest** as the test framework.
- All test files should be placed in the `tests/` directory with the `.test.ts` extension.
- The test folder structure **must mirror** the `src/` folder structure with strict 1:1 file matching.
  - Example: `src/tools/getClientDetail.ts` → `tests/tools/getClientDetail.test.ts`
  - Every `src/tools/<name>.ts` (except `index.ts` and `types.ts`) must have a matching `tests/tools/<name>.test.ts`.
  - Every `src/omadaClient/<name>.ts` (except `index.ts`) must have a matching `tests/omadaClient/<name>.test.ts`.
  - CI enforces this via `scripts/check-tool-tests.mjs` on every PR.
- Run tests with `npm test` or `npm run test:watch` for watch mode.
- Test coverage can be generated with `npm run test:coverage`.
- All configuration validations must be implemented in `src/utils/config-validations.ts` and tested thoroughly.
- No validation logic should exist outside of `src/config.ts` and `src/utils/config-validations.ts`.
- Mock external dependencies (e.g., Omada API calls) in tests to ensure isolation. Use Vitest's mocking capabilities for this purpose.

### Coverage Thresholds

Coverage is enforced at two levels:

| Level | Metric | Threshold |
|-------|--------|-----------|
| Per-file | Lines, Statements, Functions | **90%** |
| Global | Branches | **70%** |

- Per-file thresholds are enforced by Vitest (`vitest.config.ts` — `thresholds.perFile: true`).
- Global branch coverage is enforced by a dedicated CI step reading `coverage-summary.json`.
- The following files are excluded from coverage reporting (infrastructure/bootstrap code):
  - `src/omadaClient/index.ts`
  - `src/server/http.ts`
  - `src/server/stream.ts`
  - `src/omadaClient/request.ts`
- Focus on meaningful coverage — edge cases, error handling, optional params — not just line-hitting.

### Integration Tests (Docker)

> **Not implemented yet** — this section documents the planned integration testing strategy tracked in **#58** (v1.0.0 Docker infra).

Integration tests will run against a real Omada Software Controller in a Docker container. They are **not** planned to run on every PR — they serve as a milestone release gate and a harness for Phase 2 (write tools).

Planned components:
- `tests/integration/`
- `npm run test:integration`
- `test/docker/` + `test/docker/README.md`
- CI workflow `integration-tests.yml` (on demand or nightly; not per-PR)

**Phase 2 write tools MUST be tested against the Docker controller — never against `omada.miguel.ms` or any production controller.**

## AI Instruction Files

This repo exposes a single source of truth for AI agent instructions: **`CLAUDE.md`** (this file).

Three symlinks point to it so every AI agent picks it up automatically:

| Symlink | Used by |
|---|---|
| `AGENTS.md` | Codex / OpenAI agents |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.github/AGENTS.md` | Codex (alternate location) |

### Keeping symlinks intact

Symlink integrity is enforced at three levels:

1. **husky pre-commit hook** (`.husky/pre-commit`) — blocks any local commit if a symlink is missing or broken.
2. **CI workflow** (`.github/workflows/ci.yml`) — validates builds, tests, README sync, and release-readiness checks on pull requests and pushes to `main`/`develop`.
3. **Manual validation before merge** — always run `npm run symlinks:check` locally before committing or merging substantial work.

**If symlinks are ever lost**, recreate them with:

```bash
npm run symlinks:fix
git add AGENTS.md .github/copilot-instructions.md .github/AGENTS.md
git commit -m "chore: restore AI instruction symlinks"
```

> **Never replace these symlinks with copies of the file.** A copy will drift out of sync. Always keep them as symlinks.

## Development Workflow

- Install dependencies: `npm install` (runs automatically on container create).
- Development server: `npm run dev` (tsx watcher).
- Build: `npm run build` (emits to `dist/`).
- Lint: `npm run check` (Biome linting and TypeScript type checking).
- Launch configurations are available under `.vscode/launch.json` for debugging.

## Formatting & Linting

- Biome is used for both formatting and linting (`npm run format` and `npm run lint`).
- Develop using the Biome setting located in `biome.json`.
- Biome enforces import ordering, TypeScript best practices, and code style consistency.
- **IMPORTANT** All source files must use LF (Unix-style) line endings, not CRLF (Windows-style). Biome will automatically convert line endings when running `npm run format`.
- If you encounter formatting errors related to line endings (shown as `␍` in error messages), run `npm run format` to fix them automatically.

## API Validation Before Implementation (MANDATORY)

Before implementing any new tool, the following rules apply:

1. **Verify the endpoint exists** — check `docs/openapi/` to confirm the API route is documented before writing any code.
2. **Use `OMADA_TOOLS.md` as ground truth** — every tool in that file has a verified route. If a tool is listed there with a route, you can implement it.
3. **If not in `OMADA_TOOLS.md` and not in `docs/openapi/`** — do NOT implement it. Instead, raise a GitHub issue or add a comment to the existing issue noting the missing endpoint, and skip the tool.
4. **Never infer or guess API routes** — only implement against verified spec paths.
5. **When fixing route mismatches** — always check `docs/openapi/` for the correct path. Do not assume the current code is correct.

## Contribution Guidelines

- Keep environment secrets out of the repo; only commit `.env.example`.
- **Before every commit**, all of the following must pass:
  0. **API route verification** — every new tool's route must exist in `docs/openapi/` or `OMADA_TOOLS.md`. Run: `grep -c "your-route" docs/openapi/*.json` to confirm.
  1. `npm run check` — Biome lint + TypeScript type check
  2. `npm run build` — TypeScript compilation
  3. **`npm run test:coverage`** — full test suite **with coverage enforcement**. This is mandatory — NOT `npm test`. Per-file thresholds (90% lines/statements/functions) are only enforced by `test:coverage`. If any file fails its threshold, add tests before committing.
  4. `npm run symlinks:check` — AI instruction symlinks intact (auto-enforced by husky pre-commit)
- If any of the above fail, fix the issues first, then commit.
- Reference the OpenAPI spec in `docs/` when adding or updating Omada API interactions.

## GitFlow Branching Strategy

This project follows **GitFlow** strictly. Every change must go through the correct branch type before reaching `develop` or `main`.

### Branch Types and Naming

| Branch type | Pattern | Base branch | Merges into |
|-------------|---------|-------------|-------------|
| Feature | `feature/<short-description>` | `develop` | `develop` |
| Bug fix | `fix/<short-description>` | `develop` | `develop` |
| Release | `release/<version>` | `develop` | `develop` and `main` |
| Hotfix | `hotfix/<short-description>` | `main` | `main` and `develop` |

- `main` — production-ready code only. **Never commit directly to `main`.**
- `develop` — integration branch. **Never commit directly to `develop`.**

### Workflow Rules

1. **Always branch from the correct base.** Features and fixes branch from `develop`; hotfixes branch from `main`.
2. **Branch before coding.** Create the appropriate branch before making any changes.
3. **One concern per branch.** Each branch addresses a single feature, fix, release, or hotfix.
4. **All pull requests target `develop`** (or `main` for hotfixes/releases). Direct pushes to `develop` or `main` are not allowed.
5. **Ensure `npm run lint` and `npm run build` pass** before opening a pull request.
6. **Ensure test coverage stays above 90%** before merging. Run `npm run test:coverage` — not `npm test` — to verify per-file thresholds pass locally before pushing.
7. **Keep branch names lowercase and hyphenated** — e.g., `feature/add-site-list`, `fix/ssl-timeout`.

### Typical Feature Flow

```
git checkout develop
git pull
git checkout -b feature/<short-description>
# ... make changes, commit ...
git push -u origin feature/<short-description>
# open PR targeting develop
```

### Typical Hotfix Flow

```
git checkout main
git pull
git checkout -b hotfix/<short-description>
# ... make changes, commit ...
git push -u origin hotfix/<short-description>
# open PR targeting main; after merge, also merge into develop
```

## Additional Guidelines

- Write unit tests for new functionality and ensure existing tests pass.
- When adding new features or fixing bugs, follow the GitFlow branching strategy described above.
- Keep the reference `.env.example` and this documentation up to date with any new environment variables added to the project.
- **DON'T** change the JSON files under `docs/openapi/`; they should only be used as reference for the API endpoints.
- **ONLY** implement using client credentials mode Access process as described in the Omada API documentation. The client credentials should be provided via environment variables.
- After a tool or prompt is implemented, update the README.md file with a table of supported tools and prompts in the topic Supported Omada API Operations. This table should include the operationId, a brief description, and any relevant notes about the implementation. Keep it short and concise.
- Avoid using `docs/openapi/00-all.json` as a reference for implementing operations. Instead, use the individual files in `docs/openapi/` that correspond to each TAG. This will help keep the implementation focused and organized. Also the file is very large and cumbersome to navigate. All the individual files under `docs/openapi/` are generated from `00-all.json`.
- **DON'T** change anything in `node_modules` or commit any changes to that folder.
- IMPORTANT: Encapsulate the log implementation in `src/utils/logger.ts` to allow easy modification of the logging behavior in the future. Use this logger throughout the codebase instead of direct console.log statements.
- Avoid using the TypeScript `any` type; prefer precise typings or `unknown` when necessary.
- **DON'T** use `process.env.` to access environment variables directly. Access should be done outside of `src/config.ts`. All environment variables must be loaded and validated there using Zod, and then imported where needed.
- The HTTP server code uses the **Streamable HTTP** transport (MCP protocol version 2025-03-26) with a single endpoint for all operations, but this remains an explicitly unsafe, unsupported production path.
- DNS rebinding protection is implemented via origin validation and bind address restrictions for security.
- Always reuse the pagination schema in `src/utils/pagination-schema.ts` when implementing list operations that support pagination.

## Deprecated Tool Convention

When a tool is marked as deprecated (alias of another tool):

1. **Use the `[DEPRECATED]` prefix** in the tool description string — this is the repo convention. See `src/tools/getRFScanResult.ts` for the canonical format. Do NOT use bare words like "DEPRECATED" or "Deprecated" without the brackets.
2. **README.md and README.Docker.md must match the code** — if the tool description says `[DEPRECATED]`, the corresponding row in both tool tables must also reflect that (add the deprecated/alias note to the description column). Never leave a deprecated tool listed as a normal tool in the docs.
3. **Both READMEs must be updated in the same commit** as the tool description change — never defer doc alignment to a follow-up.

## Test Coverage — Mandatory Rules

### When you add methods to an existing file, extend its test file

If you add methods to any existing `src/omadaClient/*.ts` or `src/tools/*.ts` file, you **must** add corresponding tests to its matching test file in `tests/`. This is not optional.

- Extended `src/omadaClient/site.ts`? Update `tests/omadaClient/site.test.ts`.
- Added `src/tools/getFoo.ts`? Create `tests/tools/getFoo.test.ts`.

Per-file coverage is enforced at **90%** (lines, statements, functions). The CI `test:coverage` step will fail if any file drops below threshold. Do not wait for CI to catch missing tests — run `npm run test:coverage` locally before every commit.

### Never use `npm test` as the pre-commit check

`npm test` runs without coverage enforcement. Use **`npm run test:coverage`** — it's the same tests plus per-file threshold validation. A passing `npm test` does not guarantee CI will pass.

## Avoid Duplicate Endpoint Implementations

Before adding a new method to any `*Operations` class (`NetworkOperations`, `DeviceOperations`, etc.):

1. **Search the entire `src/omadaClient/` directory** for the target API path — the endpoint may already be implemented in a different Operations class.
2. **If a matching method already exists elsewhere**, delegate to it rather than re-implementing the request. Add a wrapper method that calls the existing one.
3. **Check `OmadaClient` (`src/omadaClient/index.ts`)** to see what is already publicly exposed — if the public API already covers the endpoint, do not add a duplicate private implementation.
4. Duplication across Operations classes causes inconsistent validation, diverging behaviour, and dead code — Copilot and reviewers will flag it every time.

## Documentation Synchronization

- **Two README files must be kept in sync** for Docker container usage information and MCP configuration:
  - `README.md` - Main project documentation (includes development setup, building, testing, and Docker usage)
  - `README.Docker.md` - Docker-focused documentation (excludes development information, intended for Docker Hub)
- When updating container runtime information, MCP configuration, tools, or supported operations, **both files must be updated**:
  - Quick Start (Using with Claude Desktop and Using Docker Containers sections)
  - Configuration (all environment variable tables)
  - Transport Protocols (including security considerations and ngrok usage)
  - Tools table
  - Supported Omada API Operations table
- `README.Docker.md` should **not** include development-specific sections:
  - Development workflow (npm commands, building, linting)
  - Devcontainer support
  - Local testing and debugging
- `README.Docker.md` should include a "Contributing" section with the GitHub repository URL to invite contributions.
