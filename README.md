# TP-Link Omada MCP server

A Model Context Protocol (MCP) server implemented in TypeScript that exposes the TP-Link Omada controller APIs to AI copilots and automation workflows. The server authenticates against a controller, lists sites, devices, and connected clients, and offers a generic tool to invoke arbitrary Omada API endpoints.

## Quick Start

### Using with Claude Desktop (stdio)

1. **Pull the Docker image** (or build it locally with `npm run docker:build`):

   ```bash
   docker pull ghcr.io/migueltvms/tplink-omada-mcp-cli:latest
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
           "ghcr.io/migueltvms/tplink-omada-mcp-cli:latest"
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
  ghcr.io/migueltvms/tplink-omada-mcp-cli:latest
```

#### HTTP Server Container

```bash
docker run -d \
  --env-file .env \
  -e MCP_SERVER_USE_HTTP=true \
  -e MCP_HTTP_BIND_ADDR=0.0.0.0 \
  -p 3000:3000 \
  ghcr.io/migueltvms/tplink-omada-mcp-http:latest
```

The HTTP server will be available at `http://localhost:3000/mcp` (stream transport) or `http://localhost:3000/sse` (SSE transport).

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
| `MCP_SERVER_LOG_LEVEL`   | No       | `info`  | Logging verbosity (`debug`, `info`, `warn`, `error`)                        |
| `MCP_SERVER_LOG_FORMAT`  | No       | `plain` | Log output format (`plain`, `json`, or `gcp-json`)                          |
| `MCP_SERVER_USE_HTTP`    | No       | `false` | Start HTTP server instead of stdio                                          |
| `MCP_SERVER_STATEFUL`    | No       | `false` | Maintain stateful sessions per client                                       |

#### MCP Server HTTP Configuration

These variables are only used when `MCP_SERVER_USE_HTTP=true`:

| Variable                       | Required | Default                         | Description                                                                 |
| ------------------------------ | -------- | ------------------------------- | --------------------------------------------------------------------------- |
| `MCP_HTTP_PORT`                | No       | `3000`                          | Port for the HTTP server                                                    |
| `MCP_HTTP_TRANSPORT`           | No       | `stream`                        | Transport protocol (`stream` or `sse`). See [Transport Protocols](#transport-protocols) |
| `MCP_HTTP_BIND_ADDR`           | No       | `127.0.0.1`                     | Bind address (IPv4/IPv6). Use atapter IP address to expose to the network.  |
| `MCP_HTTP_PATH`                | No       | `/mcp` or `/sse`*               | Base path for MCP endpoints (*depends on transport)                         |
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

### Transport Protocols

The MCP server supports two HTTP transport protocols:

#### Streamable HTTP (Default)

The **Streamable HTTP** transport implements the [MCP protocol version 2025-03-26](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#http-with-sse). This is the recommended transport for new integrations.

```bash
# Set transport to stream (default)
export MCP_SERVER_USE_HTTP=true
export MCP_HTTP_TRANSPORT=stream
npm run dev
```

Features:

- Single endpoint for all operations (GET, POST, DELETE)
- Server-Sent Events for streaming responses
- Built-in session management with cryptographic session IDs
- Support for stateless mode when needed

The Streamable HTTP endpoint defaults to `/mcp` and handles:

- `GET /mcp` - Establish SSE stream and initialize session
- `POST /mcp` - Send JSON-RPC messages
- `DELETE /mcp` - Terminate session

#### HTTP with SSE (Legacy)

The **HTTP+SSE** transport implements the [MCP protocol version 2024-11-05](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse). This transport is provided for backward compatibility with older MCP clients.

```bash
# Set transport to sse for legacy clients
export MCP_SERVER_USE_HTTP=true
export MCP_HTTP_TRANSPORT=sse
npm run dev
```

Features:

- Separate endpoints for SSE stream and POST messages
- Compatible with older MCP client implementations

The SSE transport uses two endpoints:

- `GET /sse` - Establish SSE connection
- `POST /messages` - Send JSON-RPC messages

#### Security Considerations

Both transports implement DNS rebinding protection:

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

By default, the server listens on `127.0.0.1:3000` and exposes the MCP endpoint at `/mcp` (for stream transport) or `/sse` (for SSE transport) with a health check on `/healthz`. Configure the bind address, port, and path using the optional `MCP_HTTP_*` environment variables documented in `.env.example`. The `npm run docker:run:http` helper wraps the HTTP image and publishes the port automatically.

#### Using ngrok (works with both transports)

To share the local server with remote tooling, you can use ngrok to expose the HTTP server publicly. This works with **both stream and SSE transports**.

**Option 1: Built-in ngrok support** (recommended)

Set the following environment variables:

```bash
export MCP_HTTP_NGROK_ENABLED=true
export MCP_HTTP_NGROK_AUTH_TOKEN=your-ngrok-auth-token
npm run dev
```

The server will automatically establish an ngrok tunnel and log the public URL.

**Option 2: Manual ngrok setup**

Run ngrok in a separate terminal after starting the server:

```bash
ngrok http 3000
```

This forwards a public HTTPS URL to `http://localhost:3000` and prints the tunnel address in the console.

If an intermediary strips the `Mcp-Session-Id` header, set `MCP_SERVER_STATEFUL=false` to disable server-managed sessions and allow stateless requests.

## Tools

| Tool                            | Description                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `listSites`                     | Lists all sites configured on the controller.                                     |
| `listDevices`                   | Lists provisioned devices for a given site.                                       |
| `listClients`                   | Lists active client devices for a site.                                           |
| `getDevice`                     | Fetches details for a specific Omada device.                                      |
| `getSwitchStackDetail`          | Retrieves detailed configuration and status for a switch stack.                   |
| `getClient`                     | Fetches details for a specific client device.                                     |
| `searchDevices`                 | Searches for devices globally across all sites the user has access to.            |
| `listDevicesStats`              | Queries statistics for global adopted devices with pagination and filtering.      |
| `getInternetInfo`               | Gets internet configuration information for a site.                               |
| `getPortForwardingStatus`       | Gets port forwarding status and rules (User or UPnP types).                       |
| `getLanNetworkList`             | Gets the list of LAN networks configured in a site.                               |
| `getLanProfileList`             | Gets the list of LAN profiles configured in a site.                               |
| `getWlanGroupList`              | Gets the list of WLAN groups configured in a site.                                |
| `getSsidList`                   | Gets the list of SSIDs in a WLAN group.                                           |
| `getSsidDetail`                 | Gets detailed information for a specific SSID.                                    |
| `getFirewallSetting`            | Gets firewall configuration and rules for a site.                                 |
| `callApi`                       | Executes a raw API request using the established Omada session token.             |

## Supported Omada API Operations

| Operation ID                        | Description                                               | Notes                                                                                                |
| ----------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `getSiteList`                       | List controller sites.                                    | Backed by `listSites`; automatic pagination is handled client-side.                                  |
| `getDeviceList`                     | List devices assigned to a site.                          | Used by `listDevices` and `getDevice` (single device lookup is resolved from this list).             |
| `searchGlobalDevice`                | Search for devices across all accessible sites.           | Used by `searchDevices`; returns devices matching the search key globally.                           |
| `getGridAdoptedDevicesStatByGlobal` | Query statistics for global adopted devices with filters. | Used by `listDevicesStats`; supports pagination and fuzzy search by MAC, name, model, or SN.         |
| `getGridActiveClients`              | List active clients connected to a site.                  | Used by `listClients` and `getClient` (single client lookup is resolved from this list).             |
| `getMostActiveClients`              | Get most active clients sorted by traffic.                | Used by `listMostActiveClients`; dashboard endpoint returning top clients by traffic usage.          |
| `getClientActivity`                 | Get client activity statistics over time.                 | Used by `listClientsActivity`; returns time-series data of new, active, and disconnected clients.    |
| `getGridPastConnections`            | Get client past connection list.                          | Used by `listClientsPastConnections`; supports pagination, filtering, sorting, and fuzzy search.     |
| `getOswStackDetail`                 | Retrieve details for a switch stack.                      | Used by `getSwitchStackDetail`.                                                                      |
| `getGlobalThreatList`               | Get global view threat management list.                   | Used by `getThreatList`; returns paginated security threats with filtering by time, severity, sites. |
| `getInternet`                       | Get internet configuration info for a site.               | Used by `getInternetInfo`; returns WAN settings and connectivity details.                            |
| `getPortForwardStatus`              | Get port forwarding status by type.                       | Used by `getPortForwardingStatus`; retrieves User or UPnP port forwarding rules.                     |
| `getLanNetworkListV2`               | Get LAN network list (v2 API).                            | Used by `getLanNetworkList`; returns VLAN settings, IP ranges, DHCP configuration.                   |
| `getLanProfileList`                 | Get LAN profile list.                                     | Used by `getLanProfileList`; returns network settings for switch ports.                              |
| `getWlanGroupList`                  | Get WLAN group list.                                      | Used by `getWlanGroupList`; returns wireless network groups. Use wlanId for `getSsidList`.           |
| `getSsidList`                       | Get SSID list for a WLAN group.                           | Used by `getSsidList`; requires wlanId from `getWlanGroupList`. Use ssidId for `getSsidDetail`.      |
| `getSsidDetail`                     | Get detailed SSID configuration.                          | Used by `getSsidDetail`; requires wlanId and ssidId. Returns security, rate limits, scheduling.      |
| `getFirewallSetting`                | Get firewall configuration for a site.                    | Used by `getFirewallSetting`; returns ACL rules, IP groups, security policies.                       |

## Devcontainer support

The repository includes a ready-to-use [devcontainer](https://containers.dev/) configuration with a dedicated Omada controller sidecar for local development and testing. See [`.devcontainer/README.md`](.devcontainer/README.md) for details.

## License

This project is licensed under the [MIT License](LICENSE).
