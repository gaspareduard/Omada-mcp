# TP-Link Omada MCP Server

A Model Context Protocol (MCP) server that exposes TP-Link Omada controller APIs to AI copilots and automation workflows. This Docker image provides an easy way to run the MCP server with support for both stdio and HTTP transports.

## Quick Start

### Using with Claude Desktop (stdio)

1. **Pull the Docker image**:

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

The HTTP server will be available at `http://localhost:3000/mcp` (stream transport) or `http://localhost:3000/sse` (SSE transport).

## Features

- OAuth client-credentials authentication with automatic token refresh
- Tools for retrieving sites, network devices, and connected clients
- Generic Omada API invoker for advanced automation scenarios
- Environment-driven configuration
- Support for both stdio and HTTP transports
- Multi-platform support (linux/amd64, linux/arm64)

## Configuration

The MCP server reads its configuration from environment variables.

### Omada Client Configuration

| Variable              | Required | Default | Description                                                                 |
| --------------------- | -------- | ------- | --------------------------------------------------------------------------- |
| `OMADA_BASE_URL`      | Yes      | -       | Base URL of the Omada controller (e.g., `https://omada-controller.local`)   |
| `OMADA_CLIENT_ID`     | Yes      | -       | OAuth client ID generated under Omada Platform Integration                  |
| `OMADA_CLIENT_SECRET` | Yes      | -       | OAuth client secret associated with the client ID                           |
| `OMADA_OMADAC_ID`     | Yes      | -       | Omada controller ID (omadacId) to target                                    |
| `OMADA_SITE_ID`       | No       | -       | Optional default site ID; if omitted, each MCP call must pass a siteId      |
| `OMADA_STRICT_SSL`    | No       | `true`  | Enforce strict SSL certificate validation (set to `false` for self-signed)  |
| `OMADA_TIMEOUT`       | No       | `30000` | HTTP request timeout in milliseconds                                        |

### MCP Generic Server Configuration

| Variable                 | Required | Default | Description                                                                 |
| ------------------------ | -------- | ------- | --------------------------------------------------------------------------- |
| `MCP_SERVER_LOG_LEVEL`   | No       | `info`  | Logging verbosity (`debug`, `info`, `warn`, `error`, `silent`)              |
| `MCP_SERVER_LOG_FORMAT`  | No       | `plain` | Log output format (`plain`, `json`, or `gcp-json`)                          |
| `MCP_SERVER_USE_HTTP`    | No       | `false` | Start HTTP server instead of stdio                                          |
| `MCP_SERVER_STATEFUL`    | No       | `false` | Maintain stateful sessions per client                                       |

### MCP Server HTTP Configuration

These variables are only used when `MCP_SERVER_USE_HTTP=true`:

| Variable                       | Required | Default                         | Description                                                                 |
| ------------------------------ | -------- | ------------------------------- | --------------------------------------------------------------------------- |
| `MCP_HTTP_PORT`                | No       | `3000`                          | Port for the HTTP server                                                    |
| `MCP_HTTP_TRANSPORT`           | No       | `stream`                        | Transport protocol (`stream` or `sse`). See [Transport Protocols](#transport-protocols) |
| `MCP_HTTP_BIND_ADDR`           | No       | `127.0.0.1`                     | Bind address (IPv4/IPv6). Use adapter IP address to expose to the network.  |
| `MCP_HTTP_PATH`                | No       | `/mcp` or `/sse`*               | Base path for MCP endpoints (*depends on transport)                         |
| `MCP_HTTP_ENABLE_HEALTHCHECK`  | No       | `true`                          | Enable a healthcheck endpoint                                               |
| `MCP_HTTP_HEALTHCHECK_PATH`    | No       | `/healthz`                      | Path for the healthcheck endpoint                                           |
| `MCP_HTTP_ALLOW_CORS`          | No       | `true`                          | Enable CORS for the HTTP server                                             |
| `MCP_HTTP_ALLOWED_ORIGINS`     | No       | `127.0.0.1, localhost`          | Comma-separated list of allowed origins. Use `*` to allow all (dev only)    |
| `MCP_HTTP_NGROK_ENABLED`       | No       | `false`                         | Use ngrok to expose the HTTP server publicly                                |
| `MCP_HTTP_NGROK_AUTH_TOKEN`    | No       | -                               | Ngrok auth token (required if `MCP_HTTP_NGROK_ENABLED=true`)                |

Create a `.env` file or export the variables before launching the container.

## Transport Protocols

The MCP server supports two HTTP transport protocols:

### Streamable HTTP (Default)

The **Streamable HTTP** transport implements the [MCP protocol version 2025-03-26](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#http-with-sse). This is the recommended transport for new integrations.

```bash
docker run -d \
  --env-file .env \
  -e MCP_SERVER_USE_HTTP=true \
  -e MCP_HTTP_TRANSPORT=stream \
  -e MCP_HTTP_BIND_ADDR=0.0.0.0 \
  -p 3000:3000 \
  jmtvms/tplink-omada-mcp:latest
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

### HTTP with SSE (Legacy)

The **HTTP+SSE** transport implements the [MCP protocol version 2024-11-05](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse). This transport is provided for backward compatibility with older MCP clients.

```bash
docker run -d \
  --env-file .env \
  -e MCP_SERVER_USE_HTTP=true \
  -e MCP_HTTP_TRANSPORT=sse \
  -e MCP_HTTP_BIND_ADDR=0.0.0.0 \
  -p 3000:3000 \
  jmtvms/tplink-omada-mcp:latest
```

Features:

- Separate endpoints for SSE stream and POST messages
- Compatible with older MCP client implementations

The SSE transport uses two endpoints:

- `GET /sse` - Establish SSE connection
- `POST /messages` - Send JSON-RPC messages

### Security Considerations

Both transports implement DNS rebinding protection:

- **Origin Validation**: The server validates the `Origin` header on all incoming connections. Configure allowed origins with `MCP_HTTP_ALLOWED_ORIGINS` (default: `127.0.0.1, localhost`). Use `*` to allow all origins (development only, not recommended for production).
- **Network Binding**: The server binds to `127.0.0.1` by default, restricting access to localhost only. Set `MCP_HTTP_BIND_ADDR=0.0.0.0` to expose the server to your network (not recommended for production without additional security measures).

For more information on the MCP protocol and transports, see the [Model Context Protocol documentation](https://modelcontextprotocol.io/).

### Using ngrok

To share the local server with remote tooling, you can use ngrok to expose the HTTP server publicly. This works with **both stream and SSE transports**.

**Built-in ngrok support**

```bash
docker run -d \
  --env-file .env \
  -e MCP_SERVER_USE_HTTP=true \
  -e MCP_HTTP_BIND_ADDR=0.0.0.0 \
  -e MCP_HTTP_NGROK_ENABLED=true \
  -e MCP_HTTP_NGROK_AUTH_TOKEN=your-ngrok-auth-token \
  -p 3000:3000 \
  jmtvms/tplink-omada-mcp:latest
```

The server will automatically establish an ngrok tunnel and log the public URL.

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

## Contributing

Want to help improve this project? Contributions are welcome! Visit our GitHub repository to report issues, suggest features, or submit pull requests:

**https://github.com/MiguelTVMS/tplink-omada-mcp**

## License

This project is licensed under the [MIT License](https://github.com/MiguelTVMS/tplink-omada-mcp?tab=MIT-1-ov-file).
