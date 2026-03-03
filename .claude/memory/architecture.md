# Architecture

## Entry Points
- `src/index.ts` — startup; picks stdio or HTTP based on env vars
- `src/config.ts` — all env var loading + Zod validation
- `src/env.ts` — raw env access (used only by config.ts)

## Source Tree
```
src/
  config.ts              # Zod-validated config (single source of truth for env)
  env.ts                 # raw env access layer
  index.ts               # startup / transport selection
  types.ts               # top-level shared types
  omadaClient/           # Omada HTTP API layer
    index.ts             # main client class
    auth.ts              # OAuth2 client credentials flow
    client.ts            # client-related API calls
    device.ts            # device API calls
    network.ts           # network API calls
    request.ts           # base HTTP request helper (axios)
    security.ts          # security API calls
    site.ts              # site API calls
  server/                # MCP transport implementations
    common.ts            # shared tool/prompt registration logic
    stdio.ts             # stdio transport
    http.ts              # HTTP coordinator
    stream.ts            # Streamable HTTP (MCP 2025-03-26)
  tools/                 # one file per MCP tool
    index.ts             # tool registration
    getClient.ts         # get a single client
    getDevice.ts         # get a single device
    getDevicesStats.ts
    getFirewallSetting.ts
    getInternetInfo.ts
    getLanNetworkList.ts
    getLanProfileList.ts
    getPortForwardingStatus.ts
    getSsidDetail.ts
    getSsidList.ts
    getSwitchStackDetail.ts
    getThreatList.ts
    getWlanGroupList.ts
    listClients.ts
    listClientsActivity.ts
    listClientsPastConnections.ts
    listDevices.ts
    listDevicesStats.ts
    listMostActiveClients.ts
    listSites.ts
    searchDevices.ts
  prompts/               # MCP prompts (currently empty / minimal)
  types/                 # centralized type definitions
    activeClientInfo.ts
    clientActivity.ts
    clientPastConnection.ts
    index.ts             # re-exports
    omadaApiResponse.ts
    omadaClientInfo.ts
    omadaDeviceInfo.ts
    omadaDeviceStats.ts
    omadaSiteSummary.ts
    oswStackDetail.ts
    paginatedResult.ts
    threatInfo.ts
    tokenResult.ts
  utils/
    config-validations.ts  # all Zod validators for config values
    logger.ts              # pino logger wrapper (use this, not console.log)
    pagination-schema.ts   # reusable Zod schema for paginated list args
docs/
  openapi/               # reference OpenAPI specs per tag (READ ONLY)
    00-all.json          # full spec — too large, use individual files instead
    *.json               # per-tag specs
tests/                   # mirrors src/ structure exactly
  config.test.ts
  env.test.ts
  index.test.ts
  omadaClient/           # mirrors src/omadaClient/
  server/                # mirrors src/server/
  tools/                 # mirrors src/tools/
  utils/                 # mirrors src/utils/
```

## HTTP Transports
| Transport | MCP Version | Endpoint |
|-----------|-------------|----------|
| `stream`  | 2025-03-26  | `/mcp` (single endpoint) |

Implements DNS rebinding protection (origin validation + bind address restriction).

## Key Dependencies
- `@modelcontextprotocol/sdk` ^1.21.0 — MCP SDK
- `axios` — HTTP client for Omada API
- `zod` ^3.x — config validation (SDK requires Zod 3)
- `pino` — structured logging
- `@ngrok/ngrok` — optional public tunnel
