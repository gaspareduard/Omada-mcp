# Safe Omada MCP Architecture

`safe-omada-mcp` is an OpenAPI-first MCP server for TP-Link Omada environments.

## Baseline

- Transport: `stdio` is the supported production path for milestone 1.
- Auth: Omada credentials come from environment variables only.
- API strategy: prefer the official TP-Link Omada Open API and local spec snapshots in `docs/openapi/`.
- Controller strategy: hosted/software controller first; controller-specific fallbacks belong in a separate compatibility track.

## Runtime boundaries

1. `src/index.ts` loads the environment config and starts the MCP server.
2. `src/config.ts` enforces capability profiles and category/permission gates.
3. `src/server/common.ts` owns MCP request logging, redaction, and mutation audit formatting.
4. `src/omadaClient/*` wraps the Omada API by domain.
5. `src/tools/*` exposes curated MCP tools and keeps the public interface small and typed.

## Tool exposure model

- `safe-read`: read-only default profile
- `ops-write`: low-risk operational mutations layered on top of read access
- `admin`: broad administrative access for trusted operators
- `compatibility`: reserved for future controller-specific fallback modules

Explicit `OMADA_TOOL_CATEGORIES` values can refine the profile, but the profile is the first gate.

## Sources

- Official Omada Open API docs: [omada-northbound-docs.tplinkcloud.com](https://omada-northbound-docs.tplinkcloud.com/#/home)
- TP-Link KB OpenAPI setup guide: [How to Configure OpenAPI via Omada Controller](https://community.tp-link.com/en/business/kb/detail/412930)
- Local spec snapshots: `docs/openapi/00-all.json`
