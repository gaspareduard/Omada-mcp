# Security Model

## Goals

- Keep the MCP surface safe for AI-facing use.
- Avoid accidental privilege escalation.
- Make every mutation auditable.

## Mandatory rules

1. No header-supplied Omada credentials.
2. No generic raw API execution in the supported runtime.
3. No internal web UI API dependency in the mainline platform.
4. No remote/public HTTP transport in the supported milestone 1 path.
5. All write tools must be category-gated, test-backed, and audit-logged.

## Secrets

- `OMADA_CLIENT_ID`
- `OMADA_CLIENT_SECRET`
- `OMADA_OMADAC_ID`

These must come from environment variables or a secret manager. They must never be accepted from user-supplied request headers.

## Logging

- MCP-layer request and tool logs are redacted in `src/server/common.ts`.
- Omada HTTP logs are redacted in `src/omadaClient/request.ts`.
- Mutation tools emit an explicit audit event with target, site, mode, and summary.

## Unsafe/compatibility features

Anything that depends on undocumented controller internals belongs in a future compatibility module, disabled by default and documented separately.
