# TP-Link Omada MCP server

A Model Context Protocol (MCP) server implemented in TypeScript that exposes the TP-Link Omada controller APIs to AI copilots and automation workflows. The server authenticates against a controller, lists sites, devices, and connected clients, and offers a generic tool to invoke arbitrary Omada API endpoints.

> **Compatibility:** Tested with Omada Controller versions 5.x and 6.x

## Quick Start

### Using with Claude Desktop (stdio)

1. **Pull the Docker image** (or build it locally with `npm run docker:build`):

   ```bash
   docker pull jmtvms/tplink-omada-mcp:latest
   ```

2. **Add the MCP server to Claude Desktop configuration**. Edit your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

3. **Add the following configuration**:

   ```json
   {
     "mcpServers": {
       "tplink-omada": {
         "command": "docker",
         "args": [
           "run",
           "-i",
           "--rm",
           "-e", "OMADA_BASE_URL=https://your-omada-controller.local",
           "-e", "OMADA_CLIENT_ID=your-client-id",
           "-e", "OMADA_CLIENT_SECRET=your-client-secret",
           "-e", "OMADA_OMADAC_ID=your-omadac-id",
           "-e", "OMADA_SITE_ID=your-site-id",
           "-e", "OMADA_STRICT_SSL=false",
           "jmtvms/tplink-omada-mcp:latest"
         ]
       }
     }
   }
   ```

   Replace the environment variable values with your actual Omada controller credentials.

4. **Restart Claude Desktop** to load the new MCP server configuration.

5. **Verify the connection** by asking Claude to list your Omada sites or devices.

### Using Docker Containers

#### CLI/stdio Container

```bash
docker run -it --rm \
  --env-file .env \
  jmtvms/tplink-omada-mcp:latest
```

#### HTTP Server Container

```bash
docker run -d \
  --env-file .env \
  -e MCP_SERVER_USE_HTTP=true \
  -e MCP_HTTP_BIND_ADDR=0.0.0.0 \
  -p 3000:3000 \
  jmtvms/tplink-omada-mcp:latest
```

The HTTP server will be available at `http://localhost:3000/mcp`.

## Features

- OAuth client-credentials authentication with automatic token refresh
- Tools for retrieving sites, network devices, and connected clients
- Generic Omada API invoker for advanced automation scenarios
- Environment-driven configuration
- Per-tag Omada OpenAPI references stored under `docs/openapi`
- Ready-to-use devcontainer with a companion Omada controller service

## Getting started

### Prerequisites

- Docker (for running pre-built containers) or Node.js 24+ (for local development)
- Access to a TP-Link Omada controller (for example using the `mbentley/omada-controller` Docker image)

### Configuration

The MCP server reads its configuration from environment variables. See `.env.example` for a complete reference.

#### Omada Client Configuration

| Variable              | Required | Default | Description                                                                 |
| --------------------- | -------- | ------- | --------------------------------------------------------------------------- |
| `OMADA_BASE_URL`      | Yes      | -       | Base URL of the Omada controller (e.g., `https://omada-controller.local`)   |
| `OMADA_CLIENT_ID`     | Yes      | -       | OAuth client ID generated under Omada Platform Integration                  |
| `OMADA_CLIENT_SECRET` | Yes      | -       | OAuth client secret associated with the client ID                           |
| `OMADA_OMADAC_ID`     | Yes      | -       | Omada controller ID (omadacId) to target                                    |
| `OMADA_SITE_ID`       | No       | -       | Optional default site ID; if omitted, each MCP call must pass a siteId      |
| `OMADA_STRICT_SSL`    | No       | `true`  | Enforce strict SSL certificate validation (set to `false` for self-signed)  |
| `OMADA_TIMEOUT`       | No       | `30000` | HTTP request timeout in milliseconds                                        |

#### MCP Generic Server Configuration

| Variable                 | Required | Default | Description                                                                 |
| ------------------------ | -------- | ------- | --------------------------------------------------------------------------- |
| `MCP_SERVER_LOG_LEVEL`   | No       | `info`  | Logging verbosity (`debug`, `info`, `warn`, `error`, `silent`)              |
| `MCP_SERVER_LOG_FORMAT`  | No       | `plain` | Log output format (`plain`, `json`, or `gcp-json`)                          |
| `MCP_SERVER_USE_HTTP`    | No       | `false` | Start HTTP server instead of stdio                                          |

> **Session IDs and authentication:** When `OMADA_CLIENT_ID`, `OMADA_CLIENT_SECRET`, and `OMADA_OMADAC_ID` are provided (the default client-credentials mode), the server runs statelessly and treats the `Mcp-Session-Id` header as optional. A future OAuth-based user authentication mode will require this header again.

#### MCP Server HTTP Configuration

These variables are only used when `MCP_SERVER_USE_HTTP=true`:

| Variable                       | Required | Default                         | Description                                                                 |
| ------------------------------ | -------- | ------------------------------- | --------------------------------------------------------------------------- |
| `MCP_HTTP_PORT`                | No       | `3000`                          | Port for the HTTP server                                                    |
| `MCP_HTTP_BIND_ADDR`           | No       | `127.0.0.1`                     | Bind address (IPv4/IPv6). Use atapter IP address to expose to the network.  |
| `MCP_HTTP_PATH`                | No       | `/mcp`                          | Base path for MCP endpoints                                                 |
| `MCP_HTTP_ENABLE_HEALTHCHECK`  | No       | `true`                          | Enable a healthcheck endpoint                                               |
| `MCP_HTTP_HEALTHCHECK_PATH`    | No       | `/healthz`                      | Path for the healthcheck endpoint                                           |
| `MCP_HTTP_ALLOW_CORS`          | No       | `true`                          | Enable CORS for the HTTP server                                             |
| `MCP_HTTP_ALLOWED_ORIGINS`     | No       | `127.0.0.1, localhost`          | Comma-separated list of allowed origins. Use `*` to allow all (dev only)    |
| `MCP_HTTP_NGROK_ENABLED`       | No       | `false`                         | Use ngrok to expose the HTTP server publicly                                |
| `MCP_HTTP_NGROK_AUTH_TOKEN`    | No       | -                               | Ngrok auth token (required if `MCP_HTTP_NGROK_ENABLED=true`)                |

Create a `.env` file (ignored by git) or export the variables before launching the server.

### Development

```bash
npm run dev
```

The dev mode keeps the TypeScript server running with live reload support via `tsx`.

### Building

```bash
npm run build
```

### Linting

```bash
npm run check
```

### Running the MCP server

```bash
npm start
```

The MCP server communicates over standard input and output. Integrate it with MCP-compatible clients by referencing the `npm start` command and providing the required environment variables.

### Docker image

A container image is provided for running the MCP server:

```bash
npm run docker:build  # Build the Docker image (tag: jmtvms/tplink-omada-mcp:latest)
npm run docker:run    # Launch the container with your .env file
npm run docker:push   # Push the image to Docker Hub
```

You can also pull the pre-built image directly from Docker Hub:

```bash
docker pull jmtvms/tplink-omada-mcp:latest
```

The same image supports both stdio and HTTP transports - configure the desired mode using environment variables (e.g., set `MCP_SERVER_USE_HTTP=true` for HTTP mode).

### Debugging with MCP Inspector

Use the MCP Inspector to interactively test tools, resources, and prompts without leaving your browser. The inspector automatically adapts to your `.env` configuration:

- **`npm run inspector`** — Launches the inspector based on your `.env` settings:
  - If `MCP_SERVER_USE_HTTP=false` (or unset): Runs the server in stdio mode with `tsx src/index.ts` for live reload debugging
  - If `MCP_SERVER_USE_HTTP=true`: Connects to an already-running HTTP server at the configured port/transport (start the server first with `npm run dev`)
  
- **`npm run inspector:build`** — Compiles the project first, then launches the inspector against the production build (`dist/index.js`) to verify release parity. Also adapts to stdio or HTTP mode based on `.env`.

**Requirements:** The inspector requires a `.env` file at the repository root. It will load both `.env` and `.env.local` (if present) to determine the server mode, port, transport, and path.

The MCP Inspector tool automatically binds to localhost and generates a session token for authentication (printed to the console and auto-filled in the browser URL).

### Transport Protocols

The MCP server uses the **Streamable HTTP** transport, which implements the [MCP protocol version 2025-03-26](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#http-with-sse).

```bash
export MCP_SERVER_USE_HTTP=true
npm run dev
```

Features:

- Single endpoint for all operations (GET, POST, DELETE)
- Server-Sent Events for streaming responses
- Built-in session management with cryptographic session IDs (the server currently operates statelessly when using client credentials)

The endpoint defaults to `/mcp` and handles:

- `GET /mcp` - Establish SSE stream and initialize session
- `POST /mcp` - Send JSON-RPC messages
- `DELETE /mcp` - Terminate session

#### Security Considerations

DNS rebinding protection is enabled by default:

- **Origin Validation**: The server validates the `Origin` header on all incoming connections. Configure allowed origins with `MCP_HTTP_ALLOWED_ORIGINS` (default: `127.0.0.1, localhost`). Use `*` to allow all origins (development only, not recommended for production).
- **Network Binding**: The server binds to `127.0.0.1` by default, restricting access to localhost only. Set `MCP_HTTP_BIND_ADDR=0.0.0.0` to expose the server to your network (not recommended for production without additional security measures).

For more information on the MCP protocol and transports, see the [Model Context Protocol documentation](https://modelcontextprotocol.io/).

### HTTP transport usage

Start the HTTP transport with:

```bash
# Start with HTTP enabled
export MCP_SERVER_USE_HTTP=true
npm run dev    # live reload during development
npm run start  # run the compiled output
```

By default, the server listens on `127.0.0.1:3000` and exposes the MCP endpoint at `/mcp` with a health check on `/healthz`. Configure the bind address, port, and path using the optional `MCP_HTTP_*` environment variables documented in `.env.example`. The `npm run docker:run:http` helper wraps the HTTP image and publishes the port automatically.

#### Using ngrok

To share the local server with remote tooling, you can use ngrok to expose the HTTP server publicly.

##### Option 1: Built-in ngrok support (recommended)

Set the following environment variables:

```bash
export MCP_HTTP_NGROK_ENABLED=true
export MCP_HTTP_NGROK_AUTH_TOKEN=your-ngrok-auth-token
npm run dev
```

The server will automatically establish an ngrok tunnel and log the public URL.

##### Option 2: Manual ngrok setup

Run ngrok in a separate terminal after starting the server:

```bash
ngrok http 3000
```

This forwards a public HTTPS URL to `http://localhost:3000` and prints the tunnel address in the console.

In client-credentials mode the server already treats `Mcp-Session-Id` as optional; if the header is removed in transit, requests will still succeed.

## Tools

### Site & Client

| Tool                        | Description                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| `listSites`                 | Lists all sites configured on the controller.                                |
| `listClients`               | Lists active client devices for a site.                                      |
| `getClient`                 | Fetches details for a specific client device.                                |
| `listMostActiveClients`     | Gets the most active clients sorted by traffic usage.                        |
| `listClientsActivity`       | Gets client activity statistics over time.                                   |
| `listClientsPastConnections`| Gets past connection history for clients.                                    |
| `setClientRateLimit`        | Sets custom bandwidth limits (download/upload) for a specific client.        |
| `setClientRateLimitProfile` | Applies a predefined rate limit profile to a specific client.                |
| `disableClientRateLimit`    | Disables bandwidth rate limiting for a specific client.                      |

### Device

| Tool                    | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `listDevices`           | Lists provisioned devices for a given site.                                       |
| `getDevice`             | Fetches details for a specific Omada device.                                      |
| `searchDevices`         | Searches for devices globally across all sites the user has access to.            |
| `listDevicesStats`      | Queries statistics for global adopted devices with pagination and filtering.      |
| `getSwitchStackDetail`  | Retrieves detailed configuration and status for a switch stack.                   |
| `getSwitchDetail`       | Fetches detailed configuration and status for a specific switch.                  |
| `getGatewayDetail`      | Fetches detailed configuration and status for a specific gateway.                 |
| `getGatewayWanStatus`   | Gets WAN port status for a specific gateway.                                      |
| `getGatewayLanStatus`   | Gets LAN port status for a specific gateway.                                      |
| `getGatewayPorts`       | Gets port information for a specific gateway.                                     |
| `getApDetail`           | Fetches detailed configuration and status for a specific access point.            |
| `getApRadios`           | Gets radio information for a specific access point.                               |
| `getStackPorts`         | Gets port information for a switch stack.                                         |
| `listPendingDevices`    | Lists devices pending adoption in a site.                                         |

### Network

| Tool                          | Description                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `getInternetInfo`             | Gets internet configuration information for a site.                         |
| `getPortForwardingStatus`     | Gets port forwarding status and rules (User or UPnP types).                 |
| `getLanNetworkList`           | Gets the list of LAN networks configured in a site.                         |
| `getLanProfileList`           | Gets the list of LAN profiles configured in a site.                         |
| `getWlanGroupList`            | Gets the list of WLAN groups configured in a site.                          |
| `getSsidList`                 | Gets the list of SSIDs in a WLAN group.                                     |
| `getSsidDetail`               | Gets detailed information for a specific SSID.                              |
| `listAllSsids`                | Lists wireless SSIDs across all WLAN groups.                                |
| `getFirewallSetting`          | Gets firewall configuration and rules for a site.                           |
| `getVpnSettings`              | Gets VPN settings for a site.                                               |
| `listSiteToSiteVpns`          | Lists site-to-site VPN configurations.                                      |
| `listPortForwardingRules`     | Lists NAT port forwarding rules.                                            |
| `listOsgAcls`                 | Lists gateway (OSG) ACL rules.                                              |
| `listEapAcls`                 | Lists access point (EAP) ACL rules.                                         |
| `listStaticRoutes`            | Lists static routing rules.                                                 |
| `listRadiusProfiles`          | Lists RADIUS authentication profiles.                                       |
| `listGroupProfiles`           | Lists group profiles (IP, MAC, or port groups).                             |
| `getApplicationControlStatus` | Gets application control status for a site.                                 |
| `getSshSetting`               | Gets SSH settings for a site.                                               |
| `listTimeRangeProfiles`       | Lists time range profiles.                                                  |
| `getWanLanStatus`             | Gets WAN-LAN connectivity status for a site.                                |
| `getRateLimitProfiles`        | Gets the list of available rate limit profiles for bandwidth control.       |

### Security & Threat Management

| Tool              | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `getThreatList`   | Gets global threat management list with filtering.        |
| `getTopThreats`   | Gets top threats from the global threat management view.  |

### Dashboard / Monitor

| Tool                         | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `getDashboardWifiSummary`    | Gets WiFi summary from the site dashboard.                      |
| `getDashboardSwitchSummary`  | Gets switch summary from the site dashboard.                    |
| `getDashboardTrafficActivities` | Gets traffic activity data from the site dashboard.          |
| `getDashboardPoEUsage`       | Gets PoE usage data from the site dashboard.                    |
| `getDashboardTopCpuUsage`    | Gets top CPU usage data from the site dashboard.                |
| `getDashboardTopMemoryUsage` | Gets top memory usage data from the site dashboard.             |
| `getDashboardMostActiveSwitches` | Gets most active switches from the site dashboard.          |
| `getDashboardMostActiveEaps` | Gets most active access points from the site dashboard.         |
| `getDashboardOverview`       | Gets overview data from the site dashboard.                     |
| `getTrafficDistribution`     | Gets traffic distribution by protocol/app type over a time range. Requires `start` and `end` timestamps (seconds). |
| `getRetryAndDroppedRate`     | Gets wireless retry rate and dropped packet rate over a time range. Requires `start` and `end` timestamps (seconds). |
| `getIspLoad`                 | Gets per-WAN ISP link load over a time range. Requires `start` and `end` timestamps (seconds). |
| `getChannels`                | Gets channel distribution and utilization across all APs.       |
| `getInterference`            | Gets top RF interference sources detected by APs.               |
| `getGridDashboardTunnelStats` | Gets VPN tunnel statistics by type. Requires `type` parameter. |
| `getGridDashboardIpsecTunnelStats` | Gets IPsec tunnel statistics.                            |
| `getGridDashboardOpenVpnTunnelStats` | Gets OpenVPN tunnel statistics by type. Requires `type` parameter. |

### Insight

| Tool                      | Description                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| `listSiteThreatManagement`| Lists site-level threat management events.                         |
| `getWids`                 | Gets WIDS (Wireless Intrusion Detection) information for a site.   |
| `getRogueAps`             | Gets rogue access points detected in a site.                       |
| `getVpnTunnelStats`       | Gets VPN tunnel statistics for a site.                             |

### Logs

| Tool                  | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `listSiteEvents`      | Lists site event logs.                                       |
| `listSiteAlerts`      | Lists site alert logs.                                       |
| `listSiteAuditLogs`   | Lists site audit logs.                                       |
| `listGlobalEvents`    | Lists global event logs across all sites.                    |
| `listGlobalAlerts`    | Lists global alert logs across all sites.                    |

## Supported Omada API Operations

| Operation ID                        | Description                                               | Tool                          |
| ----------------------------------- | --------------------------------------------------------- | ----------------------------- |
| `getSiteList`                       | List controller sites.                                    | `listSites`                   |
| `getDeviceList`                     | List devices assigned to a site.                          | `listDevices`, `getDevice`    |
| `searchGlobalDevice`                | Search for devices across all accessible sites.           | `searchDevices`               |
| `getGridAdoptedDevicesStatByGlobal` | Query statistics for global adopted devices.              | `listDevicesStats`            |
| `getOswStackDetail`                 | Retrieve details for a switch stack.                      | `getSwitchStackDetail`        |
| `getSwitch`                         | Get detailed info for a specific switch.                  | `getSwitchDetail`             |
| `getGateway`                        | Get detailed info for a specific gateway.                 | `getGatewayDetail`            |
| `getGatewayWanPortStatus`           | Get WAN port status for a specific gateway.               | `getGatewayWanStatus`         |
| `getGatewayLanPortStatus`           | Get LAN port status for a specific gateway.               | `getGatewayLanStatus`         |
| `getGatewayPorts`                   | Get port info for a specific gateway.                     | `getGatewayPorts`             |
| `getAp`                             | Get detailed info for a specific access point.            | `getApDetail`                 |
| `getApRadios`                       | Get radio info for a specific access point.               | `getApRadios`                 |
| `getStackPorts`                     | Get port info for a switch stack.                         | `getStackPorts`               |
| `getGridPendingDevices`             | List devices pending adoption in a site.                  | `listPendingDevices`          |
| `getGridActiveClients`              | List active clients connected to a site.                  | `listClients`, `getClient`    |
| `getMostActiveClients`              | Get most active clients sorted by traffic.                | `listMostActiveClients`       |
| `getClientActivity`                 | Get client activity statistics over time.                 | `listClientsActivity`         |
| `getGridPastConnections`            | Get client past connection history.                       | `listClientsPastConnections`  |
| `updateClientRateLimitSetting`      | Set rate limit setting for a client.                      | `setClientRateLimit`, `setClientRateLimitProfile`, `disableClientRateLimit` |
| `getRateLimitProfileList`           | Get rate limit profile list.                              | `getRateLimitProfiles`        |
| `getGlobalThreatList`               | Get global view threat management list.                   | `getThreatList`               |
| `getTopThreatList`                  | Get top threats from global threat management.            | `getTopThreats`               |
| `getInternet`                       | Get internet configuration info for a site.               | `getInternetInfo`             |
| `getPortForwardStatus`              | Get port forwarding status by type.                       | `getPortForwardingStatus`     |
| `getLanNetworkListV2`               | Get LAN network list (v2 API).                            | `getLanNetworkList`           |
| `getLanProfileList`                 | Get LAN profile list.                                     | `getLanProfileList`           |
| `getWlanGroupList`                  | Get WLAN group list.                                      | `getWlanGroupList`            |
| `getSsidList`                       | Get SSID list for a WLAN group.                           | `getSsidList`                 |
| `getSsidDetail`                     | Get detailed SSID configuration.                          | `getSsidDetail`               |
| `getSsidListAll`                    | List SSIDs across all WLAN groups.                        | `listAllSsids`                |
| `getFirewallSetting`                | Get firewall configuration for a site.                    | `getFirewallSetting`          |
| `getVpn`                            | Get VPN settings for a site.                              | `getVpnSettings`              |
| `getSiteToSiteVpnList`              | List site-to-site VPN configurations.                     | `listSiteToSiteVpns`          |
| `getPortForwardingList`             | List NAT port forwarding rules.                           | `listPortForwardingRules`     |
| `getOsgAclList`                     | List gateway ACL rules.                                   | `listOsgAcls`                 |
| `getEapAclList`                     | List access point ACL rules.                              | `listEapAcls`                 |
| `getStaticRoutingList`              | List static routing rules.                                | `listStaticRoutes`            |
| `getRadiusProfileList`              | List RADIUS authentication profiles.                      | `listRadiusProfiles`          |
| `getGroupProfileList`               | List group profiles (IP, MAC, port groups).               | `listGroupProfiles`           |
| `getApplicationControlStatus`       | Get application control status for a site.                | `getApplicationControlStatus` |
| `getSshSetting`                     | Get SSH settings for a site.                              | `getSshSetting`               |
| `getTimeRangeProfileList`           | List time range profiles.                                 | `listTimeRangeProfiles`       |
| `getWanLanStatus`                   | Get WAN-LAN connectivity status for a site.               | `getWanLanStatus`             |
| `getSiteThreatManagementList`       | List site-level threat management events.                 | `listSiteThreatManagement`    |
| `getWids`                           | Get WIDS information for a site.                          | `getWids`                     |
| `getRogueAps`                       | Get rogue access points detected in a site.               | `getRogueAps`                 |
| `getVpnTunnelStats`                 | Get VPN tunnel statistics for a site.                     | `getVpnTunnelStats`           |
| `getSiteEvents`                     | List site event logs.                                     | `listSiteEvents`              |
| `getSiteAlerts`                     | List site alert logs.                                     | `listSiteAlerts`              |
| `getSiteAuditLogs`                  | List site audit logs.                                     | `listSiteAuditLogs`           |
| `getEvents`                         | List global event logs across all sites.                  | `listGlobalEvents`            |
| `getAlerts`                         | List global alert logs across all sites.                  | `listGlobalAlerts`            |

## Devcontainer support

The repository includes a ready-to-use [devcontainer](https://containers.dev/) configuration with a dedicated Omada controller sidecar for local development and testing. See [`.devcontainer/README.md`](.devcontainer/README.md) for details.

## License

This project is licensed under the [MIT License](LICENSE).
