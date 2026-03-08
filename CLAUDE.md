# TP-Link Omada MCP Server - Developer Instructions

## Repository Purpose

This project implements a Model Context Protocol (MCP) server that exposes TP-Link Omada controller APIs. The server is written in TypeScript/Node.js and communicates with MCP clients over stdio and HTTP (Streamable HTTP transport).

## Tooling and Runtime

- Node.js 22 LTS (devcontainer base image `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm`).
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
- `MCP_SERVER_USE_HTTP` (default: `false`) - whether to start the HTTP server instead of stdio.

### MCP Server HTTP Configuration, if `MCP_SERVER_USE_HTTP` is `true`:

- `MCP_HTTP_PORT` (default: `3000`) - port for the HTTP server.
- `MCP_HTTP_BIND_ADDR` (default: `127.0.0.1`) - bind address for the HTTP server (IPv4 or IPv6). For security, defaults to localhost.
- `MCP_HTTP_PATH` (default: `/mcp`) - base path for MCP HTTP endpoints.
- `MCP_HTTP_ENABLE_HEALTHCHECK` (default: `true`) - enable a healthcheck endpoint at the path indicated on `MCP_HTTP_HEALTHCHECK_PATH`.
- `MCP_HTTP_HEALTHCHECK_PATH` (default: `/healthz`) - path for the healthcheck endpoint.
- `MCP_HTTP_ALLOW_CORS` (default: `true`) - enable CORS for the HTTP server.
- `MCP_HTTP_ALLOWED_ORIGINS` (default: `127.0.0.1, localhost`) - comma-separated list of allowed origins for DNS rebinding protection. Must contain valid hostnames, IPv4, IPv6 addresses, or `*` to allow all origins (development only).
- `MCP_HTTP_NGROK_ENABLED` (default: `false`) - whether to use ngrok to expose the HTTP server publicly.
- `MCP_HTTP_NGROK_AUTH_TOKEN` (optional) - ngrok auth token, required if `MCP_HTTP_NGROK_ENABLED` is `true`.

## Code Structure

- `src/index.ts` — MCP Server startup, including both stdio and HTTP server initialization. The type of server is selected based on environment variables.
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
2. **PR CI check** (`.github/workflows/pull-requests.yml`) — fails the PR if symlinks are gone.
3. **Push CI check** (`.github/workflows/integrity.yml`) — fires on every direct push to `develop`/`main`.

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

## Contribution Guidelines

- Keep environment secrets out of the repo; only commit `.env.example`.
- **Before every commit**, all of the following must pass:
  1. `npm run check` — Biome lint + TypeScript type check
  2. `npm run build` — TypeScript compilation
  3. `npm test` — full test suite
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
6. **Ensure test coverage stays above 90%** before merging (run `npm run test:coverage`).
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
- The HTTP server uses the **Streamable HTTP** transport (MCP protocol version 2025-03-26) with a single endpoint for all operations.
- DNS rebinding protection is implemented via origin validation and bind address restrictions for security.
- Always reuse the pagination schema in `src/utils/pagination-schema.ts` when implementing list operations that support pagination.

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
