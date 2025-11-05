# TP-Link Omada MCP Server - Developer Instructions

## Repository Purpose

This project implements a Model Context Protocol (MCP) server that exposes TP-Link Omada controller APIs. The server is written in TypeScript/Node.js and communicates with MCP clients over stdio and sse.

## Tooling and Runtime

- Node.js 22 LTS (devcontainer base image `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm`).
- TypeScript 5.9 with `module`/`moduleResolution` set to `NodeNext`.
- Zod 3.x for configuration validation (the MCP SDK currently expects Zod 3 APIs).
- ESLint 9 using the flat config (`eslint.config.js`), plus Prettier 3.

## Environment Variables

Reference `.env.example`. Primary variables:

Omada Client Configuration:

- `OMADA_BASE_URL` (required) - base URL of the Omada controller (e.g., `https://omada-controller.local`).
- `OMADA_CLIENT_ID` (required) - client ID for OAuth2 access.
- `OMADA_CLIENT_SECRET` (required) - client secret for OAuth2 access.
- `OMADA_SITE_ID` (optional) - site ID for the Omada controller.
- `OMADA_STRICT_SSL` (default: `true`) - whether to enforce strict SSL certificate validation.
- `OMADA_TIMEOUT` (default: `30000`) - request timeout in milliseconds.
- `OMADA_PROXY_URL` (optional) - URL of an HTTP proxy to route requests through.

MCP Generic Server Configuration:

- `MCP_SERVER_LOG_LEVEL` (default: `info`) - logging verbosity (`debug`, `info`, `warn`, `error`).
- `MCP_SERVER_USE_HTTP` (default: `false`) - whether to start the HTTP server instead of stdio.
- `MCP_SERVER_STATEFUL` (default: `false`) - whether to maintain stateful sessions per client.

MCP Server HTTP/SSE Configuration:

- `MCP_HTTP_PORT` (default: `3000`) - port for the HTTP/SSE server.
- `MCP_HTTP_HOST` (default: `0.0.0.0`) - host for the HTTP/SSE server.
- `MCP_HTTP_SSE_PATH` (default: `/sse`) - base path for MCP HTTP/SSE endpoints.
- `MCP_HTTP_ALLOW_CORS` (default: `true`) - enable CORS for the HTTP/SSE server.
- `MCP_HTTP_ALLOWED_HOSTS` (optional) - comma-separated list of allowed hosts for requests.
- `MCP_HTTP_ALLOWED_ORIGINS` (optional) - comma-separated list of allowed origins for CORS.

## Code Structure

- `src/index.ts` — MCP Server startup, including both stdio and HTTP/SSE server initialization. The type of server is selected based on environment variables.
- `src/omadaClient.ts` — Axios-based client for Omada controller REST APIs.
- `src/config.ts` — Environment variable loading and validation via Zod.
- `src/utils/` — Utility functions (e.g., logger, error handling).
- `src/omadaClient/` — Omada API interaction layer, organized by API tag (e.g., `src/omadaClient/user.ts`, `src/omadaClient/device.ts`).
- `src/server/` — Code for each implementation of the MCP server e.g. `src/server/http.ts`, `src/server/stdio.ts`. Any common server logic goes into `src/server/common.ts`.
- `src/types/` - centralized type definitions (API, MCP, errors)
- `src/tools/` - individual tool files and registration.
- `src/prompts/` - individual prompt files and registration.
- `docs/openapi/` — Reference OpenAPI specifications for Omada endpoints, split per API tag.
- `tests/` — Unit and integration tests.

## Development Workflow

- Install dependencies: `npm install` (runs automatically on container create).
- Development server: `npm run dev` (tsx watcher).
- Build: `npm run build` (emits to `dist/`).
- Lint: `npm run lint` (ESLint flat config).
- Launch configurations are available under `.vscode/launch.json` for debugging.

## Formatting & Linting

- Follow Prettier defaults (`npm run format`).
- ESLint enforces import ordering and TypeScript best practices.

## Contribution Guidelines

- Keep environment secrets out of the repo; only commit `.env.example`.
- Ensure `npm run lint` and `npm run build` pass before committing.
- Reference the OpenAPI spec in `docs/` when adding or updating Omada API interactions.

## Aditional Guidelines

- The project follows a GitFlow branching strategy: `main` reflects production-ready code, while `develop` is the integration branch. **All pull requests must target `develop`.**
- When adding new features or fixing bugs, create a new branch from `develop` and submit a pull request for review.
- Write unit tests for new functionality and ensure existing tests pass.
- Keep the reference `.env.example` and this documentation up to date with any new environment variables added to the project.
- **DON'T** change the JSON files under `docs/openapi/`; they should only be used as reference for the API endpoints.
- **ONLY** implement using client credentials mode Access processs as described in the Omada API documentation. The client credentials should be provided via environment variables.
- After a tool or prompt is implemented, update the README.md file with a table of supported tools and prompts in the topic Supported Omada API Operations. This table should include the operationId, a brief description, and any relevant notes about the implementation. Keep it short and concise.
- Avoid using `docs/openapi/00-all.json` as a reference for implementing operations. Instead, use the individual files in `docs/openapi/` that correspond to each TAG. This will help keep the implementation focused and organized. Also the file is very large and cumbersome to navigate. All the individual files under `docs/openapi/` are generated from `00-all.json`.
- **DON'T** change anything in `node_modules` or commit any changes to that folder.
- IMPORTANT: Encapsulate the log implementation in `src/utils/logger.ts` to allow easy modification of the logging behavior in the future. Use this logger throughout the codebase instead of direct console.log statements.
- Avoid using the TypeScript `any` type; prefer precise typings or `unknown` when necessary.
- Any new implementation should be done in both servers, http server and stdio server, to maintain feature parity.
