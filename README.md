# TP-Link Omada MCP server

A Model Context Protocol (MCP) server implemented in TypeScript that exposes the TP-Link Omada controller APIs to AI copilots and automation workflows. The server authenticates against a controller, lists sites, devices, and connected clients, and offers a generic tool to invoke arbitrary Omada API endpoints.

## Features

- OAuth client-credentials authentication with automatic token refresh
- Tools for retrieving sites, network devices, and connected clients
- Generic Omada API invoker for advanced automation scenarios
- Environment-driven configuration
- Per-tag Omada OpenAPI references stored under `docs/openapi`
- Ready-to-use devcontainer with a companion Omada controller service

## Getting started

### Prerequisites

- Node.js 20 or later
- npm 9 or later
- Access to a TP-Link Omada controller (for example using the `mbentley/omada-controller` Docker image)

### Installation

```bash
npm install
```

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

#### MCP Server HTTP/SSE Configuration

These variables are only used when `MCP_SERVER_USE_HTTP=true`:

| Variable                       | Required | Default     | Description                                                                 |
| ------------------------------ | -------- | ----------- | --------------------------------------------------------------------------- |
| `MCP_HTTP_PORT`                | No       | `3000`      | Port for the HTTP/SSE server                                                |
| `MCP_HTTP_HOST`                | No       | `0.0.0.0`   | Host for the HTTP/SSE server                                                |
| `MCP_HTTP_PATH`                | No       | `/mcp`      | Base path for MCP HTTP endpoints                                            |
| `MCP_HTTP_ENABLE_HEALTHCHECK`  | No       | `true`      | Enable a healthcheck endpoint                                               |
| `MCP_HTTP_HEALTHCHECK_PATH`    | No       | `/healthz`  | Path for the healthcheck endpoint                                           |
| `MCP_HTTP_ALLOW_CORS`          | No       | `true`      | Enable CORS for the HTTP/SSE server                                         |
| `MCP_HTTP_ALLOWED_HOSTS`       | No       | -           | Comma-separated list of allowed hosts for requests                          |
| `MCP_HTTP_ALLOWED_ORIGINS`     | No       | -           | Comma-separated list of allowed origins for CORS                            |
| `MCP_HTTP_NGROK_ENABLED`       | No       | `false`     | Use ngrok to expose the HTTP/SSE server publicly                            |
| `MCP_HTTP_NGROK_AUTH_TOKEN`    | No       | -           | Ngrok auth token (required if `MCP_HTTP_NGROK_ENABLED=true`)                |

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
npm run lint
```

### Running the MCP server

```bash
npm start
```

The MCP server communicates over standard input and output. Integrate it with MCP-compatible clients by referencing the `npm start` command and providing the required environment variables.

### Docker images

Two container images are provided:

```bash
npm run docker:build       # Build the CLI/stdio image (tag: ghcr.io/migueltvms/tplink-omada-mcp-cli:latest)
npm run docker:run         # Launch the CLI/stdio image with your .env file
npm run docker:build:http  # Build the HTTP/SSE image (tag: ghcr.io/migueltvms/tplink-omada-mcp-http:latest)
npm run docker:run:http    # Launch the HTTP/SSE image and publish port 3000
```

Use `npm run docker:push` and `npm run docker:push:http` to publish the images after authenticating with GitHub Container Registry.

### HTTP/SSE transport

Some clients, such as the OpenAI MCP connector, require an HTTP endpoint with Server-Sent Events. Start the streamable HTTP transport with:

```bash
npm run dev:http   # live reload during development
npm run start:http # run the compiled output
npm run ngrok:http  # expose the HTTP/SSE server via ngrok
```

By default, the server listens on `0.0.0.0:3000` and exposes the MCP endpoint at `/mcp` with a health check on `/healthz`. Configure the host, port, and path using the optional `MCP_HTTP_*` environment variables documented in `.env.example`. The `npm run docker:run:http` helper wraps the HTTP/SSE image and publishes the port automatically.

To share the local server with remote tooling, run `npm run ngrok:http` in a separate terminal after signing in with `ngrok config add-authtoken <token>`. The command forwards a public HTTPS URL to `http://localhost:3000` and prints the tunnel address in the console.

If an intermediary strips the `Mcp-Session-Id` header, set `MCP_SERVER_STATEFUL=false` to disable server-managed sessions and allow stateless requests.

## Tools

| Tool                    | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `listSites`             | Lists all sites configured on the controller.                                     |
| `listDevices`           | Lists provisioned devices for a given site.                                       |
| `listClients`           | Lists active client devices for a site.                                           |
| `getDevice`             | Fetches details for a specific Omada device.                                      |
| `getSwitchStackDetail`  | Retrieves detailed configuration and status for a switch stack.                   |
| `getClient`             | Fetches details for a specific client device.                                     |
| `searchDevices`         | Searches for devices globally across all sites the user has access to.            |
| `listDevicesStats`      | Queries statistics for global adopted devices with pagination and filtering.      |
| `callApi`               | Executes a raw API request using the established Omada session token.             |

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
| `getOswStackDetail`                 | Retrieve details for a switch stack.                      | Used by `getSwitchStackDetail`.                                                                      |

## Devcontainer support

The repository includes a ready-to-use [devcontainer](https://containers.dev/) configuration with a dedicated Omada controller sidecar for local development and testing. See [`.devcontainer/README.md`](.devcontainer/README.md) for details.

## License

This project is licensed under the [MIT License](LICENSE).
