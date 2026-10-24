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

## 0.19 policy

Catalog registration hides deprecated aliases and tool headers by default. Header opt-in permits only bounded request/correlation IDs. Compact dispatch resolves only the already enabled catalog and validates through the same schema/handler; it grants no additional permissions.

Recovery needs an explicit `recovery:rw` category and apply/confirmation arguments. Built-in profiles and `all` exclude it. The confirmation argument is not a human approval mechanism. Mutation audit events distinguish previews, controller acceptance and bounded readback outcomes.

Private CA bundles preserve TLS hostname checking; redirects are disabled. See [SECURITY.md](../SECURITY.md) for the remaining Zod advisory and trust-boundary limitations.
