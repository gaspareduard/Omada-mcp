# Coding Patterns & Conventions

## Environment Variables
- **All** env vars loaded and validated in `src/config.ts` using Zod
- `src/env.ts` is the only place that touches `process.env`
- Everywhere else imports from `src/config.ts` — never call `process.env.` directly
- Validation helpers live in `src/utils/config-validations.ts`

## TypeScript
- Module system: `NodeNext` (`"module": "NodeNext"`, `"moduleResolution": "NodeNext"`)
- No `any` — use `unknown` and narrow with type guards or Zod
- Prefer explicit return types on public functions
- All imports must use `.js` extension (NodeNext ESM requirement)

## Logging
- Use `src/utils/logger.ts` everywhere — never `console.log`
- Logger is pino-based; supports `plain`, `json`, `gcp-json` formats
- Log level controlled by `MCP_SERVER_LOG_LEVEL` env var

## Pagination
- Always reuse `src/utils/pagination-schema.ts` Zod schema for list tool args
- Don't define custom pagination params per-tool

## Adding a New Tool
1. Create `src/tools/<toolName>.ts`
2. Register it in `src/tools/index.ts`
3. Create `tests/tools/<toolName>.test.ts` (mirrors src structure)
4. Update `README.md` AND `README.Docker.md` Supported Operations table
5. Reference `docs/openapi/<tag>.json` for the API spec (not `00-all.json`)

## Adding a New HTTP Feature
- Must implement in both `src/server/sse.ts` AND `src/server/stream.ts`
- Common logic goes in `src/server/common.ts`
- DNS rebinding protection must be preserved

## Omada API Access
- Client credentials OAuth2 only (no user login flows)
- Credentials via env vars: `OMADA_CLIENT_ID`, `OMADA_CLIENT_SECRET`
- Auth logic in `src/omadaClient/auth.ts`
- Base HTTP logic in `src/omadaClient/request.ts` (axios wrapper)

## Formatting
- Biome handles formatting + linting (not ESLint/Prettier)
- LF line endings required — `npm run format` fixes CRLF automatically
- Import ordering enforced by Biome
- Config: `biome.json` at repo root

## Documentation
- `README.md` — full docs (dev + Docker)
- `README.Docker.md` — Docker-only docs (no dev sections)
- Both must be updated together for: tools, env vars, transport info
- `README.Docker.md` must include a Contributing section with GitHub URL
