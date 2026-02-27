# TP-Link Omada MCP Server - Developer Instructions

## Repository Purpose

This project implements a Model Context Protocol (MCP) server that exposes TP-Link Omada controller APIs. The server is written in TypeScript/Node.js and communicates with MCP clients over stdio and sse.

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
- `MCP_HTTP_TRANSPORT` (default: `stream`) - transport protocol (`stream` for Streamable HTTP [MCP 2025-03-26], `sse` for HTTP+SSE [MCP 2024-11-05]).
- `MCP_HTTP_BIND_ADDR` (default: `127.0.0.1`) - bind address for the HTTP server (IPv4 or IPv6). For security, defaults to localhost.
- `MCP_HTTP_PATH` (default: `/mcp` for stream, `/sse` for sse) - base path for MCP HTTP endpoints. If explicitly set, overrides transport-based default.
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
  - `src/server/http.ts` - HTTP server coordinator that delegates to transport-specific implementations
  - `src/server/sse.ts` - HTTP+SSE transport implementation (MCP 2024-11-05)
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

- The project uses **Vitest** as the test framework.
- All test files should be placed in the `tests/` directory with the `.test.ts` extension.
- The test folder structure **must mirror** the `src/` folder structure for consistency and maintainability.
- Run tests with `npm test` or `npm run test:watch` for watch mode.
- Test coverage can be generated with `npm run test:coverage`. The coverage needs to be above 80% on Lines, Branches, Functions, and Statements for the entire project. Focus on covering edge cases and error handling. Always validate after making changes.
- All configuration validations must be implemented in `src/utils/config-validations.ts` and tested thoroughly.
- No validation logic should exist outside of `src/config.ts` and `src/utils/config-validations.ts`.
- Mock external dependencies (e.g., Omada API calls) in tests to ensure isolation. Use Vitest's mocking capabilities for this purpose.
- Keep the coverage above 90% for all source files. Focus on covering edge cases and error handling. Always validate after making changes.

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
- Ensure `npm run lint` and `npm run build` pass before committing.
- Reference the OpenAPI spec in `docs/` when adding or updating Omada API interactions.

## Additional Guidelines

- The project follows a GitFlow branching strategy: `main` reflects production-ready code, while `develop` is the integration branch. **All pull requests must target `develop`.**
- When adding new features or fixing bugs, create a new branch from `develop` and submit a pull request for review.
- Write unit tests for new functionality and ensure existing tests pass.
- Keep the reference `.env.example` and this documentation up to date with any new environment variables added to the project.
- **DON'T** change the JSON files under `docs/openapi/`; they should only be used as reference for the API endpoints.
- **ONLY** implement using client credentials mode Access process as described in the Omada API documentation. The client credentials should be provided via environment variables.
- After a tool or prompt is implemented, update the README.md file with a table of supported tools and prompts in the topic Supported Omada API Operations. This table should include the operationId, a brief description, and any relevant notes about the implementation. Keep it short and concise.
- Avoid using `docs/openapi/00-all.json` as a reference for implementing operations. Instead, use the individual files in `docs/openapi/` that correspond to each TAG. This will help keep the implementation focused and organized. Also the file is very large and cumbersome to navigate. All the individual files under `docs/openapi/` are generated from `00-all.json`.
- **DON'T** change anything in `node_modules` or commit any changes to that folder.
- IMPORTANT: Encapsulate the log implementation in `src/utils/logger.ts` to allow easy modification of the logging behavior in the future. Use this logger throughout the codebase instead of direct console.log statements.
- Avoid using the TypeScript `any` type; prefer precise typings or `unknown` when necessary.
- Any new HTTP transport implementation should be done for both `sse` and `stream` transports to maintain feature parity.
- **DON'T** use `process.env.` to access environment variables directly. Access should be done outside of `src/config.ts`. All environment variables must be loaded and validated there using Zod, and then imported where needed.
- The HTTP server supports two transport protocols:
  - **Streamable HTTP** (`stream`) - MCP protocol version 2025-03-26, single endpoint for all operations
  - **HTTP+SSE** (`sse`) - MCP protocol version 2024-11-05, separate endpoints for SSE stream and POST messages
- Both transports implement DNS rebinding protection via origin validation and bind address restrictions for security.
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
