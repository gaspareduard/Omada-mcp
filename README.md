# Safe Omada MCP

Security-focused MCP server for TP-Link Omada Open API workflows.

## At a Glance

- Production-safe baseline uses `stdio`
- Omada credentials are environment-only
- Capability profiles and category gating control what tools are exposed
- HTTP remains in the codebase only as an explicitly unsafe, lab-only path
- Validated against live Omada Controller 6.x environments and designed around the documented 5.x/6.x Open API surface

## Quick Start

### Option 1: Use with Claude Desktop via Docker

1. Pull or build an image:

   ```bash
   docker pull ghcr.io/ailivesinterminal/omada-mcp:latest
   ```

   If you do not publish an image yet, build locally instead:

   ```bash
   npm run docker:build
   ```

2. Edit your Claude Desktop MCP config:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

3. Add the server entry:

   ```json
   {
     "mcpServers": {
       "safe-omada": {
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
           "-e", "OMADA_STRICT_SSL=true",
           "ghcr.io/ailivesinterminal/omada-mcp:latest"
         ]
       }
     }
   }
   ```

4. Restart Claude Desktop and verify the server by listing sites or devices.

### Option 2: Run the container directly

```bash
docker run --rm -it \
  --env-file .env \
  ghcr.io/ailivesinterminal/omada-mcp:latest
```

### Option 3: Run locally for development

```bash
npm install
npm run build
npm start
```

## Configuration

The server reads configuration from environment variables. See `.env.example` for the complete reference.

### Required Omada Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `OMADA_BASE_URL` | Yes | - | Base URL of the Omada controller |
| `OMADA_CLIENT_ID` | Yes | - | OAuth client ID from Omada Platform Integration |
| `OMADA_CLIENT_SECRET` | Yes | - | OAuth client secret |
| `OMADA_OMADAC_ID` | Yes | - | Omada controller ID (`omadacId`) |
| `OMADA_SITE_ID` | No | - | Optional default site ID |
| `OMADA_STRICT_SSL` | No | `true` | Enforce TLS certificate validation |
| `OMADA_TIMEOUT` | No | `30000` | HTTP timeout in milliseconds |

### Capability and Logging

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `OMADA_CAPABILITY_PROFILE` | No | `safe-read` | Built-in profile: `safe-read`, `ops-write`, `admin`, `compatibility` |
| `OMADA_TOOL_CATEGORIES` | No | profile default | Explicit category override |
| `MCP_SERVER_LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error`, `silent` |
| `MCP_SERVER_LOG_FORMAT` | No | `plain` | `plain`, `json`, or `gcp-json` |

### Capability Profiles

| Profile | Intended use |
| --- | --- |
| `safe-read` | Default read-only operational visibility |
| `ops-write` | Limited operational write actions |
| `admin` | Full documented tool surface, including admin mutations |
| `compatibility` | Reserved for future controller-specific fallback modules |

### Optional HTTP Lab Mode

HTTP is **not** part of the supported production baseline.

It only starts when both of these are set:
- `MCP_SERVER_USE_HTTP=true`
- `MCP_UNSAFE_ENABLE_HTTP=true`

Use it only for local lab/debug scenarios.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MCP_SERVER_USE_HTTP` | No | `false` | Legacy lab-only switch |
| `MCP_UNSAFE_ENABLE_HTTP` | No | `false` | Explicit acknowledgement required |
| `MCP_HTTP_PORT` | No | `3000` | HTTP port |
| `MCP_HTTP_BIND_ADDR` | No | `127.0.0.1` | Loopback bind address only (`127.0.0.1` or `::1`) |
| `MCP_HTTP_PATH` | No | `/mcp` | MCP endpoint path |
| `MCP_HTTP_ENABLE_HEALTHCHECK` | No | `true` | Enable health check |
| `MCP_HTTP_HEALTHCHECK_PATH` | No | `/healthz` | Health check path |
| `MCP_HTTP_ALLOW_CORS` | No | `true` | Enable CORS |
| `MCP_HTTP_ALLOWED_ORIGINS` | No | `127.0.0.1, localhost` | Allowed origins |
| `MCP_HTTP_NGROK_ENABLED` | No | `false` | Legacy placeholder; disabled in safe baseline |
| `MCP_HTTP_NGROK_AUTH_TOKEN` | No | - | Legacy placeholder |

## Development and Validation

### Common Commands

| Task | Command |
| --- | --- |
| Run dev server | `npm run dev` |
| Build | `npm run build` |
| Lint + type-check | `npm run check` |
| Unit tests | `npm test` |
| Coverage gates | `npm run test:coverage` |
| Symlink integrity | `npm run symlinks:check` |
| README/tool sync | `node scripts/check-readme-sync.mjs` |
| Tool/test mapping | `node scripts/check-tool-tests.mjs` |

### Inspector

Use the MCP Inspector when you want to test the built server interactively:

```bash
npm run inspector
npm run inspector:build
```

## Project Notes

- The safe baseline is `stdio` first.
- HTTP remains a legacy, explicitly unsafe lab path.
- The repo includes `docs/openapi/` as the implementation reference for Omada endpoints.
- README tool tables below are kept in sync with the registered MCP tools.

## Tools

### Site & Client

| Tool                        | Description                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| `listSites` | Lists all sites configured on the controller. |
| `getSiteCapacity` | Get site capacity settings including maximum device and client counts. |
| `getSiteDetail` | Get detailed information about a site, including name, region, timezone, and configuration. |
| `getSiteDeviceAccount` | Get device account settings for a site. |
| `getSiteNtpStatus` | Get NTP server status and configuration for a site. |
| `getSiteRememberSetting` | Get the remember device setting for a site. |
| `getSiteSpecification` | Get site specification including device limits and feature capabilities. |
| `getSiteUrl` | Get the URL associated with a site for OpenAPI access. |
| `getSiteTemplateConfig` | Get configuration settings for a site template. Requires `siteTemplateId`. |
| `getSiteTemplateDetail` | Get detailed information about a site template. Requires `siteTemplateId`. |
| `getSiteTemplateList` | List all site templates configured on the controller. |
| `listClients` | Lists active client devices for a site. |
| `getClient` | [DEPRECATED] Use `listClients` instead. When you have a client MAC, `getClientDetail` is also available. This tool filters the site client list in-process. |
| `listMostActiveClients` | Gets the most active clients sorted by traffic usage. |
| `listClientsActivity` | Gets client activity statistics over time. |
| `listClientsPastConnections`| Gets past connection history for clients.                                    |
| `setClientRateLimit` | Sets custom bandwidth limits (download/upload) for a specific client. |
| `setClientRateLimitProfile` | Applies a predefined rate limit profile to a specific client.                |
| `disableClientRateLimit` | Disables bandwidth rate limiting for a specific client. |
| `blockClient` | Blocks a client from network access with an auditable mutation summary. |
| `unblockClient` | Restores a blocked client to network access with an auditable mutation summary. |
| `reconnectClient` | Forces a client to reconnect with an auditable mutation summary. |
| `rebootDevice` | Reboots a managed device with an auditable mutation summary. |
| `setDeviceLed` | Changes a device LED state with an auditable mutation summary. |
### Device

| Tool                    | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `listDevices` | Lists provisioned devices for a given site. |
| `getDevice` | [DEPRECATED] Use `listDevices` instead and filter results client-side. This tool filters the site device list in-process; there is no dedicated device-detail endpoint. |
| `searchDevices` | Searches for devices globally across all sites the user has access to. |
| `listDevicesStats` | Queries statistics for global adopted devices with pagination and filtering. |
| `getSwitchStackDetail` | Retrieves detailed configuration and status for a switch stack. |
| `getSwitchDetail` | Fetches detailed configuration and status for a specific switch. |
| `getGatewayDetail` | Fetches detailed configuration and status for a specific gateway. |
| `getGatewayWanStatus` | Gets WAN port status for a specific gateway. |
| `getGatewayLanStatus` | Gets LAN port status for a specific gateway. |
| `getGatewayPorts` | Gets port information for a specific gateway. |
| `getApDetail` | Fetches detailed configuration and status for a specific access point. |
| `getApRadios` | Gets radio information for a specific access point. |
| `getStackPorts` | Gets port information for a switch stack. |
| `listPendingDevices` | Lists devices pending adoption in a site. |
| `getAllDeviceBySite` | Gets all devices in a site including offline and disconnected devices. |
| `getFirmwareInfo` | Gets the latest available firmware info for a device. Use `listDevices` for MACs. |
| `getGridAutoCheckUpgrade` | Gets the auto-check firmware upgrade plan list (paginated).                     |
| `listSwitchNetworks` | Lists VLAN network assignments for a switch (paginated). Requires `switchMac`. |
| `getSwitchGeneralConfig` | Gets general configuration for a switch. Requires `switchMac`.                  |
| `getCableTestLogs` | Gets cable test history for a switch. Requires `switchMac`. |
| `getCableTestFullResults` | Gets full per-port cable diagnostics for a switch. Requires `switchMac`.        |
| `getOswStackLagList` | Gets Link Aggregation Group (LAG) list for a switch stack. Requires `stackId`. |
| `getStackNetworkList` | Gets VLAN network list for a switch stack (paginated). Requires `stackId`. |
| `getApUplinkConfig` | Gets uplink configuration for an AP (wired/mesh mode). Requires `apMac`. |
| `getRadiosConfig` | Gets per-radio configuration for an AP (channel, power, width). Requires `apMac`. |
| `getApVlanConfig` | Get VLAN configuration for an access point, including management VLAN and per-SSID VLAN tagging settings. |
| `getMeshStatistics` | Gets mesh link statistics for an AP. Requires `apMac`. |
| `getRFScanResult` | Gets last RF scan results for an AP. Requires `apMac`. |
| `getSpeedTestResults` | Gets last speed test results for an AP. Requires `apMac`. |
| `getApSnmpConfig` | Gets SNMP configuration for an AP. Requires `apMac`. |
| `getApLldpConfig` | Gets LLDP configuration for an AP. Requires `apMac`. |
| `getApGeneralConfig` | Gets general configuration for an AP (name, LED, country). Requires `apMac`. |
| `getUplinkWiredDetail` | Get wired uplink detail for an access point: uplink switch, port number, link speed, and PoE status. |
| `getDownlinkWiredDevices` | Gets wired downlink devices on an AP's LAN ports. Requires `apMac`.            |
| `getFirmwareUpgradePlan` | Get the firmware upgrade plan list for devices managed by the controller. |
| `getUpgradeLogs` | Get firmware upgrade logs showing the history of upgrade operations performed on devices. |
| `getDeviceTagList` | Get the list of device tags defined in a site. |
| `getApQosConfig` | Get QoS configuration for a specific access point. Requires `apMac`. |
| `getApIpv6Config` | Get IPv6 configuration for a specific access point. Requires `apMac`. |
| `getSitesApsIpSetting` | Get IP settings for an AP. Requires `apMac`. |
| `getSitesApsChannelLimit` | Get channel limit configuration for an AP. Requires `apMac`. |
| `getSitesApsAvailableChannel` | Get list of available channels for an AP. Requires `apMac`. |
| `getSitesApsLoadBalance` | Get load balance configuration for an AP. Requires `apMac`. |
| `getSitesApsOfdma` | Get OFDMA configuration for an AP. Requires `apMac`. |
| `getSitesApsPowerSaving` | Get power saving configuration for an AP. Requires `apMac`. |
| `setApPowerSaving` | Updates AP power saving configuration with support checks and dry-run preview. Requires `apMac`. |
| `setApChannelLimit` | Updates AP channel-limit configuration with support checks and dry-run preview. Requires `apMac`. |
| `setApConfig` | Updates documented AP configuration families with dry-run preview. Covers AP general, IP, IPv6, QoS, radio, service, load-balance, OFDMA, trunk, bridge, WLAN group, port, channel, AFC, and antenna settings. Setter-only families return planned payloads and an explicit warning when controller readback is unavailable. Requires `apMac`. |
| `getSitesApsTrunkSetting` | Get trunk port setting for an AP. Requires `apMac`. |
| `getSitesApsBridge` | Get bridge configuration for an AP. Requires `apMac`. |
| `listSitesApsPorts` | List ports for an AP. Requires `apMac`. |
| `getSitesSwitchesEs` | Get ES switch details. Requires `switchMac`. |
| `getSitesSwitchesEsGeneralConfig` | Get ES switch general configuration. Requires `switchMac`. |
| `listSitesCableTestSwitchesPorts` | List cable test port info for a switch. Requires `switchMac`. |
| `listSitesCableTestSwitchesIncrementResults` | Get incremental cable test results for a switch. Requires `switchMac`. |
| `getUpgradeOverviewCritical` | Get the number of critical models available for upgrade. |
| `getUpgradeOverviewTryBeta` | Get the current status of the try-beta firmware upgrade switch. |
| `listUpgradeFirmwares` | List available firmware packages for upgrade (paginated). |
| `listUpgradeOverviewFirmwares` | List firmware overview for upgradeable devices (paginated). |
| `listSitesStacks` | List switch stacks in a site (paginated). |
| `getSitesDeviceWhiteList` | Get the device adoption whitelist for a site (paginated). |
| `getSitesGatewaysGeneralConfig` | Get general configuration for a gateway. Requires `gatewayMac`. |
| `getSitesGatewaysPin` | Get PIN information for a gateway. Requires `gatewayMac`. |
| `getSitesGatewaysSimCardUsed` | Get SIM card usage info for a gateway. Requires `gatewayMac`. |
| `getSitesHealthGatewaysWansDetails` | Get gateway WAN health details. Requires `gatewayMac`. |
| `setGatewayConfig` | Updates documented gateway configuration families with dry-run preview. Covers general, services, advanced, radios, WLAN, and port settings. Setter-only families return planned payloads and an explicit warning when controller readback is unavailable. Requires `gatewayMac`. |

### Network

| Tool                          | Description                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `getInternetInfo` | Gets internet configuration information for a site. |
| `getInternet` | [DEPRECATED] Use `getInternetInfo` instead. Gets full WAN/Internet configuration for the site gateway. |
| `getInternetBasicPortInfo` | Gets WAN port summary/basic info for the site gateway. |
| `getInternetLoadBalance` | Gets WAN load balancing configuration (failover/load balance). |
| `getWanPortsConfig` | Gets per-port WAN configuration including connection type and IP settings. |
| `getWanLanStatus` | Gets WAN-LAN connectivity status for a site. |
| `getGridVirtualWan` | Gets virtual WAN list (paginated). |
| `getIspBandScan` | Gets ISP band scan results for a WAN port. Requires `portUuid`. |
| `getDisableNatList` | Gets the list of wired networks with NAT disabled (paginated). |
| `getLtePortConfig` | Gets LTE/cellular WAN port configuration. |
| `getWanPortDetail` | [DEPRECATED] Use `getWanPortsConfig` instead. Gets detailed WAN port configuration for all gateway WAN ports. |
| `getWanIspProfile` | Gets ISP scan profile result for a WAN port. Requires `portUuid`. |
| `getWanQosConfig` | Gets QoS configuration for gateway WAN ports. |
| `getWanHealthDetail` | [DEPRECATED] Alias for the WAN health tool; kept for backward compatibility. Requires `gatewayMac`. |
| `getWanUsageStats` | [DEPRECATED] Use `getDashboardTrafficActivities` instead. Gets WAN traffic usage statistics for the site. |
| `getWanNatConfig` | Gets one-to-one NAT rules (paginated). |
| `getPortForwardingStatus` | Gets port forwarding status and rules. Required: `type` (`user` or `upnp`). Optional pagination: `page` (default 1), `pageSize` (default 10). |
| `getLanNetworkList` | [DEPRECATED] Use `getLanNetworkListV2` instead. This tool aggregates all pages; getLanNetworkListV2 is explicitly paginated. |
| `getLanNetworkListV2` | Get the LAN network list using the v2 API, with richer VLAN and DHCP data (paginated). |
| `getInterfaceLanNetwork` | Gets interface-level LAN network bindings. Optional type filter (0=WAN, 1=LAN). |
| `getInterfaceLanNetworkV2` | Get interface-level LAN network bindings (v2 API). Returns richer per-interface VLAN and network data. |
| `getLanProfileList` | Gets the list of LAN profiles configured in a site. |
| `getApLoadBalance` | [DEPRECATED] Use `getSitesApsLoadBalance` instead. Same endpoint, retained for backward compatibility. getSitesApsLoadBalance is the canonical tool name. |
| `getApOfdmaConfig` | [DEPRECATED] Use `getSitesApsOfdma` instead. Same endpoint, retained for backward compatibility. getSitesApsOfdma is the canonical tool name. |
| `getMulticastRateLimit` | Get multicast rate limit settings for a site. |
| `getWlanGroupList` | Gets the list of WLAN groups configured in a site. |
| `getSsidList` | Gets the list of SSIDs in a WLAN group. |
| `getSsidDetail` | Gets detailed information for a specific SSID. Required: `wlanId` and `ssidId`. |
| `listAllSsids` | Lists wireless SSIDs across all WLAN groups. |
| `getFirewallSetting` | Gets the site-global firewall settings returned by the official Omada firewall endpoint. |
| `setFirewallSetting` | Updates site firewall settings with dry-run preview using the official Omada Open API firewall endpoint. |
| `setAclConfigTypeSetting` | Updates the gateway ACL mode (`through profiles` or `custom`) with dry-run preview. |
| `getVpnSettings` | Gets VPN settings for a site. |
| `listSiteToSiteVpns` | Lists site-to-site VPN configurations. |
| `listPortForwardingRules` | [DEPRECATED] Use `getPortForwardingList` instead. Lists NAT port forwarding rules. |
| `listOsgAcls` | Lists gateway (OSG) ACL rules. |
| `createGatewayAcl` | Creates a gateway ACL rule with dry-run preview using the official Omada Gateway ACL schema. |
| `updateGatewayAcl` | Updates a gateway ACL rule with dry-run preview after confirming the ACL exists. |
| `listEapAcls` | Lists access point (EAP) ACL rules. |
| `createEapAcl` | Creates an EAP ACL rule with dry-run preview using the official Omada EAP ACL schema. |
| `updateEapAcl` | Updates an EAP ACL rule with dry-run preview after confirming the ACL exists. |
| `deleteAcl` | Deletes an ACL rule with dry-run preview after confirming the ACL exists. |
| `listStaticRoutes` | [DEPRECATED] Use `getGridStaticRouting` instead. This tool aggregates all pages; getGridStaticRouting returns a single paginated page. |
| `getStaticRoutingInterfaceList` | Gets available interfaces for static routing.                             |
| `listPolicyRoutes` | [DEPRECATED] Use `getGridPolicyRouting` instead. This tool aggregates all pages; getGridPolicyRouting is paginated. |
| `getGridPolicyRouting` | Gets policy routing rules (paginated). |
| `getOspfProcess` | Gets OSPF process configuration for the site gateway. |
| `getOspfInterface` | Gets OSPF interface configuration for the site gateway. |
| `getVrrpConfig` | Gets VRRP configuration for OSW devices. |
| `getOspfNeighbors` | Gets OSPF neighbor devices for the site gateway. |
| `getGridOtoNats` | Gets 1:1 NAT rules (paginated). |
| `getAlg` | Gets ALG (Application Layer Gateway) configuration. |
| `getUpnpSetting` | Gets UPnP setting for the site gateway. |
| `getDdnsGrid` | Gets DDNS entries (paginated). |
| `getDhcpReservationGrid` | Gets DHCP reservations (paginated). |
| `createDhcpReservation` | Creates a DHCP reservation after validating the target LAN and optional IP address. |
| `updateDhcpReservation` | Updates a DHCP reservation after validating the target LAN and optional IP address. |
| `deleteDhcpReservation` | Deletes a DHCP reservation by MAC address with a dry-run preview option. |
| `getGridIpMacBinding` | Gets IP-MAC binding entries (paginated). |
| `getIpMacBindingGeneralSetting` | Gets IP-MAC binding global toggle setting.                               |
| `getBandwidthControl` | Gets global bandwidth control configuration. |
| `getGridBandwidthCtrlRule` | Gets bandwidth control rules (paginated). |
| `setBandwidthControlRule` | Creates or updates a bandwidth control rule with dry-run preview after validating the target rule id plus referenced LAN and WAN identifiers. |
| `deleteBandwidthControlRule` | Deletes a bandwidth control rule with dry-run preview after confirming the rule exists. |
| `getSessionLimit` | Gets session limit global setting. |
| `getGridSessionLimitRule` | Gets per-rule session limit rules (paginated). |
| `getSnmpSetting` | Gets SNMP configuration (version, community string). |
| `getLldpSetting` | Gets LLDP global setting. |
| `getRemoteLoggingSetting` | Gets remote logging (syslog) configuration. |
| `getDnsCacheDataList` | Gets the DNS cache data list (paginated). |
| `getIptvSetting` | Gets IPTV service configuration for the site. |
| `getNtpSetting` | Gets NTP server configuration and synchronisation status. |
| `getSyslogConfig` | Deprecated; alias of `getRemoteLoggingSetting` for controller syslog configuration. |
| `getAccessControl` | Gets controller access control configuration. |
| `setAccessControl` | Updates portal access control settings with dry-run preview and schema validation for pre-auth and free-auth policy entries. |
| `setAppControlRule` | Creates or updates an application control rule with dry-run preview after validating the create/update payload shape, existing rule id, and referenced application ids. |
| `deleteAppControlRule` | Deletes an application control rule with dry-run preview after confirming the rule exists. |
| `getDnsCacheSetting` | Gets DNS cache setting. |
| `getDnsProxy` | Gets DNS proxy configuration. |
| `getIgmp` | Gets IGMP snooping and proxy setting. |
| `getSwitchVlanInterface` | Gets VLAN interface configuration for a specific switch. Requires `switchMac`. |
| `getLanDnsRules` | Gets LAN DNS rules for the site (paginated). |
| `getLanProfileEsUsage` | Gets EAP/switch device usage for a LAN profile. Requires `profileId`. |
| `getLanClientCount` | Gets client distribution breakdown across LAN segments. |
| `listRadiusProfiles` | Lists RADIUS authentication profiles. |
| `listGroupProfiles` | Lists group profiles (IP, MAC, or port groups). |
| `getApplicationControlStatus` | Gets application control status for a site.                                 |
| `getSshSetting` | Gets SSH settings for a site. |
| `listTimeRangeProfiles` | Lists time range profiles. |
| `getRateLimitProfiles` | Gets the list of available rate limit profiles for bandwidth control. |
### Firewall & ACL

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getDot1xConfig` | Get 802.1X switch port authentication setting. Alias for `getSwitchDot1xSetting`. |
| `getRadiusProxyConfig` | Get global RADIUS proxy configuration (controller-level, no siteId). |
| `getApplicationAcl` | [DEPRECATED] Get application control rules. Alias for `getAppControlRules`. |
### Firewall Traffic & QoS

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getGatewayQosClassRules` | Get gateway QoS class rules (paginated). |
| `getBandwidthCtrlDetail` | Get bandwidth control details for a site. |
| `getAppControlRules` | Get application control rules (paginated). |
| `getAppControlCategories` | Get application control category list. |
| `getUrlFilterRules` | Get URL filter gateway rules. Alias for `getGridGatewayRule`. |
| `getUrlFilterBlacklist` | Get URL filter MAC deny list. Alias for `getGridDenyMacFiltering`. |
| `getUrlFilterWhitelist` | Get URL filter MAC allow list. Alias for `getGridAllowMacFiltering`. |
| `getMacFilterDetail` | Get MAC filter general setting. Alias for `getMacFilteringGeneralSetting`. |
| `getQosPolicy` | Get QoS policy configuration for a site. |
| `getTrafficPriority` | Get traffic priority rules for a site. |
| `getTrafficStats` | [DEPRECATED] Use `getDashboardTrafficActivities` instead. Get WAN usage statistics. Alias for `getWanUsageStats`. |
| `getQosPolicyRule` | [DEPRECATED] Alias for `getQosPolicy`. |
| `getQosMarkingRule` | [DEPRECATED] Alias for `getQosPolicy`. |
| `getDscpConfig` | [DEPRECATED] Alias for `getQosPolicy`. |
### Firewall IDS / IPS

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getGlobalSecuritySetting` | [DEPRECATED] Use `getThreatList` instead. Get global security/threat management list. Alias for `getThreatList`. |
### Security & Threat Management

| Tool              | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `getThreatList` | Gets global threat management list. Required: `archived` (bool). Optional: `startTime`/`endTime` (seconds since epoch), `severity` (0=Critical, 1=Major, 2=Moderate/Concerning, 3=Minor, 4=Low), `page`, `pageSize`. |
| `getTopThreats` | Gets top threats from the global threat management view. |
### Composite Troubleshooting Tools

Single-call tools that internally aggregate multiple Omada API calls in parallel. Use these instead of chaining individual tools when you need a quick overview or are starting a troubleshooting session.

| Tool | Description |
| ---- | ----------- |
| `getNetworkHealthSummary` | Composite: combines dashboard overview (device/client counts), internet/WAN status, client distribution, and recent active threats into a single response. First call for any troubleshooting session. |
| `getGatewayHealth` | Composite: auto-discovers the gateway then fetches its detail (CPU, memory, firmware), WAN port statuses, LAN interface statuses, and port list in one call. Use for internet/WAN diagnostics. |
| `diagnoseClient` | Composite: given a client MAC, IP, or hostname — fetches current connection status, detailed client info (VLAN, signal, policy), and recent connection history in one call. |
| `getSecurityOverview` | Composite: combines active threat list (up to 20, newest first) and firewall settings into one response. Use for security posture checks or investigating alerts. |

### Dashboard / Monitor

| Tool                         | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `getDashboardWifiSummary` | Gets WiFi summary from the site dashboard. |
| `getDashboardSwitchSummary` | Gets switch summary from the site dashboard. |
| `getDashboardTrafficActivities` | Gets traffic activity data from the site dashboard.          |
| `getDashboardPoEUsage` | Gets PoE usage data from the site dashboard. |
| `getDashboardTopCpuUsage` | Gets top CPU usage data from the site dashboard. |
| `getDashboardTopMemoryUsage` | Gets top memory usage data from the site dashboard.             |
| `getDashboardMostActiveSwitches` | Gets most active switches from the site dashboard.          |
| `getDashboardMostActiveEaps` | Gets most active access points from the site dashboard.         |
| `getDashboardOverview` | Get the site overview: device counts, client counts, connectivity graph, and overall health status. |
| `getTrafficDistribution` | Gets traffic distribution by protocol/app type over a time range. Requires `start` and `end` timestamps (seconds). |
| `getRetryAndDroppedRate` | Gets wireless retry rate and dropped packet rate over a time range. Requires `start` and `end` timestamps (seconds). |
| `getIspLoad` | Gets per-WAN ISP link load over a time range. Requires `start` and `end` timestamps (seconds). |
| `getChannels` | Gets channel distribution and utilization across all APs. |
| `getInterference` | Gets top RF interference sources detected by APs. |
| `getGridDashboardTunnelStats` | Gets VPN tunnel statistics. Required: `type` (0 = Server, 1 = Client). |
| `getGridDashboardIpsecTunnelStats` | Gets IPsec tunnel statistics.                            |
| `getGridDashboardOpenVpnTunnelStats` | Gets OpenVPN tunnel statistics by type. Requires `type` parameter. |

### Insight

| Tool                      | Description                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| `listSiteThreatManagement`| Lists site-level threat management events.                         |
| `getWids` | Gets WIDS (Wireless Intrusion Detection) information for a site. |
| `getRogueAps` | Gets rogue access points detected in a site. |
| `getVpnTunnelStats` | Gets VPN tunnel statistics for a site. |
### VPN

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getIpsecTunnelList` | List all site-to-site VPN (IPsec) tunnels. Alias for `listSiteToSiteVpns`. |
| `getIpsecTunnelDetail` | Get detailed config for a specific IPsec tunnel by ID. Alias for `getSiteToSiteVpnInfo`. |
| `getAdvancedVpnSetting` | Get advanced VPN configuration settings for a site. Alias for `getVpnSettings`. |
| `getVpnUserList` | Get VPN users for a site (paginated). |
| `getVpnUserDetail` | Get users for a specific client-to-site VPN server. |
| `getVpnClientStatus` | Get status of client-to-site VPN clients. Alias for `listClientToSiteVpnClients`. |
| `getVpnRouteConfig` | [DEPRECATED] Use `getGridPolicyRouting` instead. This tool aggregates all pages; getGridPolicyRouting is paginated. |
### Profiles

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getGoogleLdapProfile` | Get Google LDAP profile configuration for a site. |
| `getBuiltinRadiusUsers` | Get built-in RADIUS server user list (paginated). |
| `getRadiusUserDetail` | [DEPRECATED] Alias for `getBuiltinRadiusUsers`. |
| `getPpskNetworkProfile` | List PPSK network profiles for a site by type. |
| `getPpskUserGroup` | Get PPSK user group details for a specific profile. |
| `getPpskUserList` | [DEPRECATED] Alias for `getPpskUserGroup`. |
| `getServiceProfile` | Get service type profiles (paginated). Alias for `listServiceType`. |
| `getQosProfile` | Get rate limit profiles. Alias for `getRateLimitProfiles`. |
| `getScheduleProfile` | Get time range profiles. Alias for `listTimeRangeProfiles`. |
| `getGroupPolicyDetail` | Get group policy profiles filtered by group type. |
| `getIpGroupProfile` | [DEPRECATED] Get IP group profiles. Alias for `getGroupPolicyDetail` with groupType="0". |
| `getUrlGroupProfile` | [DEPRECATED] Get URL/port group profiles. Alias for `getGroupPolicyDetail` with groupType="1". |
| `getAppGroupProfile` | [DEPRECATED] Get MAC group profiles. Alias for `getGroupPolicyDetail` with groupType="2". |
| `getVlanProfile` | Get LAN/VLAN profiles. Alias for `getLanProfileList`. |
| `getUserRoleProfile` | Get user role profiles from the controller (global, no siteId). |
| `getPortalProfile` | Get captive portal profiles for a site. |
### Logs

| Tool                  | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `listSiteEvents` | Lists site event logs. |
| `listSiteAlerts` | Lists site alert logs. |
| `listSiteAuditLogs` | Lists site audit logs. |
| `listGlobalEvents` | Lists global event logs across all sites. |
| `listGlobalAlerts` | Lists global alert logs across all sites. |
### Controller

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getCertificate` | Get SSL/TLS certificate configuration for the controller. |
| `getClientHistoryDataEnable` | Get the client history data collection enable setting. |
| `getControllerPort` | Get the controller port configuration for device adoption. |
| `getDataRetention` | Get data retention settings for the controller. |
| `getExperienceImprovement` | Get the experience improvement program setting (telemetry). |
| `getGlobalDashboardOverview` | Get global controller dashboard overview without client data. |
| `getPortalPort` | Get portal port configuration for the controller web interface. |
### Maintenance

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getBackupFileList` | List available controller backup files. |
| `getBackupResult` | Get the result of the most recent controller backup operation. |
| `getRestoreResult` | Get the result of the most recent controller restore operation. |
| `getSiteBackupFileList` | List available backup files for a site. |
| `getSiteBackupResult` | Get the backup result for a site. |
| `getRogueApExport` | Export Rogue AP scan results for a site in CSV or Excel format. |
| `backupController` | Trigger a controller configuration backup to the self/cloud server. |
| `backupControllerToFileServer` | Trigger a controller configuration backup to an external file server (FTP/SFTP). |
| `restoreController` | Restore controller configuration from a backup file on the self/cloud server. |
| `restoreControllerFromFileServer` | Restore controller configuration from a backup file on an external file server. |
| `backupSites` | Trigger a multi-site configuration backup to the self/cloud server (up to 300 sites). |
| `backupSitesToFileServer` | Trigger a multi-site configuration backup to an external file server (up to 300 sites). |
| `restoreSites` | Restore multiple site configurations from backup files on the self/cloud server. |
| `restoreSitesFromFileServer` | Restore multiple site configurations from backup files on an external file server. |
### Account Users

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getAllCloudUsers` | List all cloud users on the controller, excluding the root account. |
| `getAllLocalUsers` | List all local users on the controller, excluding the root account. |
| `getAllRoles` | [DEPRECATED] Use `getUserRoleProfile` instead. List all user roles configured on the controller. |
| `getAllUsersApp` | List all users (cloud and local) in grid view. |
| `getAvailableRoles` | List roles available for user assignment. |
| `getRoleDetail` | Get detailed information about a specific role. Requires `roleId`. |
### Account Cloud

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getCloudAccessStatus` | Get cloud access status for the controller. |
| `getCloudUserInfo` | Get cloud user account information. |
| `getMfaStatus` | Get global MFA (multi-factor authentication) status. |
| `getRemoteBindingStatus` | Get remote binding status between controller and cloud. |
### Schedules

| Tool                          | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getPoeScheduleList` | List PoE schedules for a site. |
| `getPortScheduleList` | List port schedules for a site. |
| `getPortSchedulePorts` | List ports with port schedule assignments for a site. |
| `getRebootScheduleList` | List device reboot schedules for a site template. Requires `siteTemplateId`. |
| `getUpgradeScheduleList` | List firmware upgrade schedules for a site. |
## Supported Omada API Operations

| Operation ID                        | Description                                               | Tool                          |
| ----------------------------------- | --------------------------------------------------------- | ----------------------------- |
| `getSiteList` | List controller sites.                                    | `listSites` |
| `getDeviceList` | List devices assigned to a site.                          | `listDevices`, ~~`getDevice`~~ [DEPRECATED] |
| `searchGlobalDevice` | Search for devices across all accessible sites.           | `searchDevices` |
| `getGridAdoptedDevicesStatByGlobal` | Query statistics for global adopted devices.              | `listDevicesStats`            |
| `getOswStackDetail` | Retrieve details for a switch stack.                      | `getSwitchStackDetail` |
| `getSwitch` | Get detailed info for a specific switch.                  | `getSwitchDetail` |
| `getGateway` | Get detailed info for a specific gateway.                 | `getGatewayDetail` |
| `getGatewayWanPortStatus` | Get WAN port status for a specific gateway.               | `getGatewayWanStatus` |
| `getGatewayLanPortStatus` | Get LAN port status for a specific gateway.               | `getGatewayLanStatus` |
| `getGatewayPorts` | Get port info for a specific gateway.                     | `getGatewayPorts` |
| `getAp` | Get detailed info for a specific access point.            | `getApDetail` |
| `getApRadios` | Get radio info for a specific access point.               | `getApRadios` |
| `getStackPorts` | Get port info for a switch stack.                         | `getStackPorts` |
| `getGridPendingDevices` | List devices pending adoption in a site.                  | `listPendingDevices` |
| `getGridActiveClients` | List active clients connected to a site.                  | `listClients`, ~~`getClient`~~ [DEPRECATED] |
| `getMostActiveClients` | Get most active clients sorted by traffic.                | `listMostActiveClients` |
| `getClientActivity` | Get client activity statistics over time.                 | `listClientsActivity` |
| `getGridPastConnections` | Get client past connection history.                       | `listClientsPastConnections` |
| `updateClientRateLimitSetting` | Set rate limit setting for a client.                      | `setClientRateLimit`, `setClientRateLimitProfile`, `disableClientRateLimit` |
| `getRateLimitProfileList` | Get rate limit profile list.                              | `getRateLimitProfiles` |
| `getGlobalThreatList` | Get global view threat management list.                   | `getThreatList` |
| `getTopThreatList` | Get top threats from global threat management.            | `getTopThreats` |
| `getInternet` | [DEPRECATED] Use `getInternetInfo` instead. Get internet configuration info for a site.               | `getInternetInfo` |
| `getPortForwardStatus` | Get port forwarding status by type.                       | `getPortForwardingStatus` |
| `getLanProfileList` | Get LAN profile list.                                     | `getLanProfileList` |
| `getWlanGroupList` | Get WLAN group list.                                      | `getWlanGroupList` |
| `getSsidList` | Get SSID list for a WLAN group.                           | `getSsidList` |
| `getSsidDetail` | Get detailed SSID configuration.                          | `getSsidDetail` |
| `getSsidListAll` | List SSIDs across all WLAN groups.                        | `listAllSsids` |
| `getFirewallSetting` | Get the site-global firewall settings returned by the official Omada firewall endpoint. | `getFirewallSetting` |
| `modifyFirewallSetting` | Update site firewall settings with dry-run support. | `setFirewallSetting` |
| `getVpn` | Get VPN settings for a site.                              | `getVpnSettings` |
| `getSiteToSiteVpnList` | List site-to-site VPN configurations.                     | `listSiteToSiteVpns` |
| `getPortForwardingList` | List NAT port forwarding rules.                           | `getPortForwardingList` (prefer); ~~`listPortForwardingRules`~~ [DEPRECATED] |
| `getOsgAclList` | List gateway ACL rules.                                   | `listOsgAcls` |
| `getAclConfigTypeSetting` | Get gateway ACL config mode for the site gateway. | `getAclConfigTypeSetting` |
| `modifyAclConfigTypeSetting` | Update gateway ACL config mode with dry-run support. | `setAclConfigTypeSetting` |
| `createOsgAcl` | Create a gateway ACL with dry-run support. | `createGatewayAcl` |
| `modifyOsgAcl` | Update a gateway ACL with dry-run support. | `updateGatewayAcl` |
| `getEapAclList` | List access point ACL rules.                              | `listEapAcls` |
| `createEapAcl` | Create an EAP ACL with dry-run support. | `createEapAcl` |
| `modifyEapAcl` | Update an EAP ACL with dry-run support. | `updateEapAcl` |
| `deleteAcl` | Delete an ACL rule with dry-run support. | `deleteAcl` |
| `getStaticRoutingList` | List static routing rules.                                | `getGridStaticRouting` (prefer); ~~`listStaticRoutes`~~ [DEPRECATED] |
| `getRadiusProfileList` | List RADIUS authentication profiles.                      | `listRadiusProfiles` |
| `getGroupProfileList` | List group profiles (IP, MAC, port groups).               | `listGroupProfiles` |
| `getApplicationControlStatus` | Get application control status for a site.                | `getApplicationControlStatus` |
| `addRule` | Create an application control rule with dry-run support. | `setAppControlRule` |
| `editRule` | Update an application control rule with dry-run support. | `setAppControlRule` |
| `deleteRules` | Delete an application control rule with dry-run support. | `deleteAppControlRule` |
| `getSshSetting` | Get SSH settings for a site.                              | `getSshSetting` |
| `getTimeRangeProfileList` | List time range profiles.                                 | `listTimeRangeProfiles` |
| `getWanLanStatus` | Get WAN-LAN connectivity status for a site.               | `getWanLanStatus` |
| `getSiteThreatManagementList` | List site-level threat management events.                 | `listSiteThreatManagement` |
| `getWids` | Get WIDS information for a site.                          | `getWids` |
| `getRogueAps` | Get rogue access points detected in a site.               | `getRogueAps` |
| `getVpnTunnelStats` | Get VPN tunnel statistics for a site.                     | `getVpnTunnelStats` |
| `getSiteEvents` | List site event logs.                                     | `listSiteEvents` |
| `getSiteAlerts` | List site alert logs.                                     | `listSiteAlerts` |
| `getSiteAuditLogs` | List site audit logs.                                     | `listSiteAuditLogs` |
| `getEvents` | List global event logs across all sites.                  | `listGlobalEvents` |
| `getAlerts` | List global alert logs across all sites.                  | `listGlobalAlerts` |
| `disableClientRateLimit` | Disable rate limiting for a specific client, removing any bandwidth.... | `disableClientRateLimit` |
| `getAccessControl` | Get controller access control configuration. | `getAccessControl` |
| `modifyAccessControl` | Update portal access control configuration with dry-run support. | `setAccessControl` |
| `getAlg` | Get ALG (Application Layer Gateway) configuration for the site gateway. | `getAlg` |
| `getAllDeviceBySite` | Get all devices in a site including offline and disconnected devices. | `getAllDeviceBySite` |
| `getApDetail` | Fetch full configuration and status for a specific access point: mo.... | `getApDetail` |
| `getApGeneralConfig` | Get general configuration for an access point. | `getApGeneralConfig` |
| `getApLldpConfig` | Get LLDP (Link Layer Discovery Protocol) configuration for an acces.... | `getApLldpConfig` |
| `getApRadios` | Get radio status for a specific access point: 2.4GHz and 5GHz band .... | `getApRadios` |
| `getApSnmpConfig` | Get SNMP configuration for an access point. | `getApSnmpConfig` |
| `getApUplinkConfig` | Get the uplink configuration for an access point. | `getApUplinkConfig` |
| `getBandwidthControl` | Get the global bandwidth control configuration for the site. | `getBandwidthControl` |
| `getCableTestLogs` | Get cable test logs for a switch. | `getCableTestLogs` |
| `getChannels` | Get channel distribution and utilization across all APs. | `getChannels` |
| `getClient` | [DEPRECATED] Use `listClients` instead. When you have a client MAC, `getClientDetail` is also available. This tool filters the site client list in-process. | `getClient` |
| `getDashboardPoEUsage` | Get PoE (Power over Ethernet) usage statistics for a site, showing .... | `getDashboardPoEUsage` |
| `getDashboardSwitchSummary` | Get switch summary for a site dashboard: total switch count, total .... | `getDashboardSwitchSummary` |
| `getDashboardTopCpuUsage` | Get the top devices by CPU usage for a site, useful for identifying.... | `getDashboardTopCpuUsage` |
| `getDashboardWifiSummary` | Get WiFi summary for a site dashboard: total APs, connected AP coun.... | `getDashboardWifiSummary` |
| `getDdnsGrid` | Get DDNS (Dynamic DNS) entries for the site gateway. | `getDdnsGrid` |
| `getDevice` | [DEPRECATED] Use `listDevices` instead. This alias filters the device list in-process to return a single device; there is no separate device-detail API. | `getDevice` |
| `getDhcpReservationGrid` | Get DHCP reservations for the site. | `getDhcpReservationGrid` |
| `createDhcpReservation` | Create a DHCP reservation for the site after LAN/IP validation and duplicate-IP preflight. | `createDhcpReservation` |
| `updateSitesSettingServiceDhcp` | Update an existing DHCP reservation for the site. | `updateDhcpReservation` |
| `deleteSitesSettingServiceDhcp` | Delete an existing DHCP reservation for the site. | `deleteDhcpReservation` |
| `getDnsCacheSetting` | Get DNS cache setting for the site gateway. | `getDnsCacheSetting` |
| `getDnsProxy` | Get DNS proxy configuration for the site gateway. | `getDnsProxy` |
| `getFirewallSetting` | Get the site-global firewall settings returned by the official Omada firewall endpoint. | `getFirewallSetting` |
| `modifyFirewallSetting` | Update site firewall settings with dry-run support. | `setFirewallSetting` |
| `getFirmwareInfo` | Get the latest available firmware information for a device. | `getFirmwareInfo` |
| `getGatewayDetail` | Fetch full configuration and status for a specific gateway: model, .... | `getGatewayDetail` |
| `getGatewayLanStatus` | Get LAN port status for a specific gateway: port link state, speed,.... | `getGatewayLanStatus` |
| `getGatewayPorts` | Get all WAN and LAN port details for a specific gateway: link statu.... | `getGatewayPorts` |
| `getGatewayWanStatus` | Get the WAN port status and connectivity information for a specific.... | `getGatewayWanStatus` |
| `getGridBandwidthCtrlRule` | Get bandwidth control rules for the site gateway. | `getGridBandwidthCtrlRule` |
| `createBandwidthCtrlRule` | Create a bandwidth control rule with dry-run support. | `setBandwidthControlRule` |
| `modifyBandwidthCtrlRule` | Update a bandwidth control rule with dry-run support. | `setBandwidthControlRule` |
| `deleteBandwidthCtrlRule` | Delete a bandwidth control rule with dry-run support. | `deleteBandwidthControlRule` |
| `getGridIpMacBinding` | Get IP-MAC binding entries for the site. | `getGridIpMacBinding` |
| `getGridOtoNats` | Get 1:1 NAT rules for the site gateway. | `getGridOtoNats` |
| `getGridPolicyRouting` | Get policy routing rules for the site gateway. | `getGridPolicyRouting` |
| `getGridSessionLimitRule` | Get per-rule session limit rules for the site gateway. | `getGridSessionLimitRule` |
| `getGridVirtualWan` | Get virtual WAN list for the site gateway. | `getGridVirtualWan` |
| `getIgmp` | Get IGMP (Internet Group Management Protocol) setting for the site. | `getIgmp` |
| `getInterfaceLanNetwork` | Get interface-level LAN network bindings. | `getInterfaceLanNetwork` |
| `getInterference` | Get top RF interference sources detected by APs. | `getInterference` |
| `getInternet` | [DEPRECATED] Use `getInternetInfo` instead. Get full WAN/Internet configuration for the site gateway. | `getInternet` |
| `getInternetBasicPortInfo` | Get WAN port summary / basic info for the site gateway. | `getInternetBasicPortInfo` |
| `getInternetInfo` | Get internet configuration information for a site, including WAN se.... | `getInternetInfo` |
| `getInternetLoadBalance` | Get WAN load balancing configuration for the site gateway. | `getInternetLoadBalance` |
| `getIspBandScan` | Get ISP band scan results for a WAN port. Requires `portUuid`. | `getIspBandScan` |
| `getIspLoad` | Get per-WAN ISP link load over a time range. | `getIspLoad` |
| `getLanClientCount` | Get client distribution breakdown across LAN segments (wired, wireless, guest). | `getLanClientCount` |
| `getLanDnsRules` | Get LAN DNS rules configured for the site (paginated). | `getLanDnsRules` |
| `getLanNetworkList` | [DEPRECATED] Use `getLanNetworkListV2` instead. This tool aggregates all pages; getLanNetworkListV2 is explicitly paginated. | `getLanNetworkList` |
| `getLanProfileEsUsage` | Get EAP/switch device usage for a specific LAN profile. Requires `profileId`. | `getLanProfileEsUsage` |
| `getLanProfileList` | Get the list of LAN profiles configured in a site. | `getLanProfileList` |
| `getLtePortConfig` | Get LTE/cellular WAN port configuration for the site gateway. | `getLtePortConfig` |
| `getLldpSetting` | Get LLDP (Link Layer Discovery Protocol) global setting for the site. | `getLldpSetting` |
| `getMeshStatistics` | Get mesh link statistics for an access point. | `getMeshStatistics` |
| `getOswStackLagList` | Get Link Aggregation Group (LAG) list for a switch stack. | `getOswStackLagList` |
| `getPortForwardingList` | Get a paginated page of NAT port forwarding rules for the site gateway. | `getPortForwardingListPage` |
| `getPortForwardingStatus` | Get port forwarding status and rules for a site. | `getPortForwardingStatus` |
| `getRFScanResult` | [DEPRECATED] Get the last RF scan results for an access point. | `getRFScanResult` |
| `getRadiosConfig` | Get per-radio configuration for an access point. | `getRadiosConfig` |
| `getRateLimitProfiles` | Get the list of available rate limit profiles for a site. | `getRateLimitProfiles` |
| `getRemoteLoggingSetting` | Get remote logging (syslog) configuration for the site. | `getRemoteLoggingSetting` |
| `getDnsCacheDataList` | Get the DNS cache data list for the site (paginated). | `getDnsCacheDataList` |
| `getDisableNatList` | Get the list of wired networks with NAT disabled (paginated). | `getDisableNatList` |
| `getIptvSetting` | Get IPTV service configuration for the site. | `getIptvSetting` |
| `getNtpSetting` | Get NTP server configuration and synchronisation status for the site. | `getNtpSetting` |
| `getOspfInterface` | Get OSPF interface configuration for the site gateway. | `getOspfInterface` |
| `getOspfNeighbors` | Get OSPF neighbor devices for the site gateway. | `getOspfNeighbors` |
| `getOspfProcess` | Get OSPF process configuration for the site gateway. | `getOspfProcess` |
| `getSwitchVlanInterface` | Get VLAN interface configuration for a specific switch. Requires `switchMac`. | `getSwitchVlanInterface` |
| `getSyslogConfig` | [DEPRECATED] Alias of `getRemoteLogging` for controller syslog configuration. | `getSyslogConfig` |
| `getVrrpConfig` | Get VRRP configuration for OSW devices on the site. | `getVrrpConfig` |
| `getWanHealthDetail` | [DEPRECATED] Alias for the WAN health tool; kept for backward compatibility. Requires `gatewayMac`. | `getWanHealthDetail` |
| `getWanIspProfile` | Get ISP scan profile result for a WAN port. Requires `portUuid`. | `getWanIspProfile` |
| `getWanNatConfig` | Get one-to-one NAT configuration (WAN NAT rules) for the site gateway (paginated). | `getWanNatConfig` |
| `getWanPortDetail` | [DEPRECATED] Use `getWanPortsConfig` instead. Get detailed WAN port configuration for all gateway WAN ports on the site. | `getWanPortDetail` |
| `getWanQosConfig` | Get QoS configuration for gateway WAN ports on the site. | `getWanQosConfig` |
| `getWanUsageStats` | [DEPRECATED] Use `getDashboardTrafficActivities` instead. Get WAN traffic usage statistics and activity data for the site. | `getWanUsageStats` |
| `getRetryAndDroppedRate` | Get wireless retry rate and dropped packet rate over a time range. | `getRetryAndDroppedRate` |
| `getRogueAps` | Get the list of rogue (unauthorized) access points detected by WIDS.... | `getRogueAps` |
| `getSessionLimit` | Get the session limit global setting for the site gateway. | `getSessionLimit` |
| `getSnmpSetting` | Get SNMP configuration for the site. | `getSnmpSetting` |
| `getSpeedTestResults` | Get the last speed test results for an access point. | `getSpeedTestResults` |
| `getSitesApsChannelLimit` | Get AP channel-limit configuration. | `getSitesApsChannelLimit` |
| `updateSitesApsChannelLimit` | Update AP channel-limit configuration with dry-run support. | `setApChannelLimit` |
| `modifyGeneralConfig_2` | Update AP general configuration with dry-run support. | `setApConfig` |
| `modifyIpSettingConfig` | Update AP IP settings with dry-run support. | `setApConfig` |
| `modifyIpv6SettingConfig` | Update AP IPv6 settings with dry-run support. | `setApConfig` |
| `modifyApQosConfig` | Update AP QoS settings with dry-run support. | `setApConfig` |
| `modifyRadiosConfig` | Update AP radio settings with dry-run support. | `setApConfig` |
| `modifyApServicesConfig` | Update AP service settings with dry-run support. | `setApConfig` |
| `modifyApLoadBalanceConfig` | Update AP load-balance settings with dry-run support. | `setApConfig` |
| `modifyApOfdmaConfig` | Update AP OFDMA settings with dry-run support. | `setApConfig` |
| `getSitesApsPowerSaving` | Get AP power saving configuration. | `getSitesApsPowerSaving` |
| `updateSitesApsPowerSaving` | Update AP power saving configuration with dry-run support. | `setApPowerSaving` |
| `modifyApTrunkSettingConfig` | Update AP trunk settings with dry-run support. | `setApConfig` |
| `modifyApBridgeInfo` | Update AP bridge settings with dry-run support. | `setApConfig` |
| `modifyApPort` | Update AP port settings with dry-run support. | `setApConfig` |
| `modifyApChannelConfig` | Update AP channel configuration with dry-run support. | `setApConfig` |
| `modifyAfcConfig` | Update AP AFC configuration with dry-run support. | `setApConfig` |
| `modifyAntennaGainConfig` | Update AP antenna gain settings with dry-run support. | `setApConfig` |
| `updateWlanGroupConfig` | Update AP WLAN group assignment with dry-run support. | `setApConfig` |
| `modifyGeneralConfig_1` | Update gateway general configuration with dry-run support. | `setGatewayConfig` |
| `modifyConfigGeneral` | Update gateway config/general settings with dry-run support. | `setGatewayConfig` |
| `modifyConfigServices` | Update gateway services configuration with dry-run support. | `setGatewayConfig` |
| `modifyConfigAdvanced` | Update gateway advanced settings with dry-run support. | `setGatewayConfig` |
| `modifyConfigRadios` | Update gateway radio configuration with dry-run support. | `setGatewayConfig` |
| `modifyConfigWlans` | Update gateway WLAN configuration with dry-run support. | `setGatewayConfig` |
| `modifyPortConfig` | Update a gateway port configuration with dry-run support. | `setGatewayConfig` |
| `batchModifyPortConfig` | Update multiple gateway ports with dry-run support. | `setGatewayConfig` |
| `getSshSetting` | Get SSH access settings for a site. | `getSshSetting` |
| `getSsidDetail` | Get detailed information for a specific SSID (wireless network), in.... | `getSsidDetail` |
| `getSsidList` | Get the list of SSIDs (wireless networks) configured in a WLAN group. | `getSsidList` |
| `getStackNetworkList` | Get the VLAN network list for a switch stack. | `getStackNetworkList` |
| `getStackPorts` | Get all port information for a switch stack. | `getStackPorts` |
| `getSwitchDetail` | Fetch full configuration and status for a specific switch: model, f.... | `getSwitchDetail` |
| `getSwitchStackDetail` | Fetch detailed information for a specific switch stack. | `getSwitchStackDetail` |
| `getThreatList` | Get the global view threat management list. | `getThreatList` |
| `getTopThreats` | Get the top threats from the global threat management view across a.... | `getTopThreats` |
| `getTrafficDistribution` | Get traffic distribution by protocol and application type over a ti.... | `getTrafficDistribution` |
| `getUpnpSetting` | Get UPnP (Universal Plug and Play) setting for the site. | `getUpnpSetting` |
| `getVpnSettings` | Get VPN configuration settings for a site. | `getVpnSettings` |
| `getVpnTunnelStats` | Get VPN tunnel statistics for a site (paginated), including active .... | `getVpnTunnelStats` |
| `getWanLanStatus` | Get the WAN and LAN connectivity status for a site. | `getWanLanStatus` |
| `getWanPortsConfig` | Get WAN port settings for the site gateway. | `getWanPortsConfig` |
| `getWids` | Get Wireless Intrusion Detection System (WIDS) information for a si.... | `getWids` |
| `getWlanGroupList` | Get the list of WLAN groups configured in a site. | `getWlanGroupList` |
| `listAllSsids` | List all wireless SSIDs across all WLAN groups in a site: SSID name.... | `listAllSsids` |
| `listClients` | List all network clients (wired and wireless) connected to a site. | `listClients` |
| `listClientsActivity` | Get client activity statistics over time from the dashboard. | `listClientsActivity` |
| `listClientsPastConnections` | Get client past connection list with historical connection data. | `listClientsPastConnections` |
| `listDevices` | List all provisioned (adopted) network devices in a site: gateways,.... | `listDevices` |
| `listEapAcls` | List EAP (access point) ACL rules for a site: wireless client acces.... | `listEapAcls` |
| `listGlobalAlerts` | List alert logs across all sites on the controller: threshold breac.... | `listGlobalAlerts` |
| `listGlobalEvents` | List system event logs across all sites on the controller. | `listGlobalEvents` |
| `listGroupProfiles` | List group profiles (IP groups, MAC groups, port groups) configured.... | `listGroupProfiles` |
| `listMostActiveClients` | Get the most active clients in a site, sorted by total traffic. | `listMostActiveClients` |
| `listOsgAcls` | List gateway (OSG) ACL rules for a site: firewall rules controlling.... | `listOsgAcls` |
| `listPendingDevices` | List devices discovered on the network but not yet adopted into thi.... | `listPendingDevices` |
| `listPolicyRoutes` | [DEPRECATED] Use `getGridPolicyRouting` instead. This tool aggregates all pages; getGridPolicyRouting is paginated. | `listPolicyRoutes` |
| `listPortForwardingRules` | [DEPRECATED] Use `getPortForwardingList` instead. List all NAT port forwarding rules for a site: external port, inter.... | `listPortForwardingRules` |
| `listRadiusProfiles` | List RADIUS authentication profiles configured for a site: server I.... | `listRadiusProfiles` |
| `listSiteAlerts` | List alert logs for a site: threshold breaches, device failures, se.... | `listSiteAlerts` |
| `listSiteAuditLogs` | List admin audit logs for a site: who made what configuration chang.... | `listSiteAuditLogs` |
| `listSiteEvents` | List system event logs for a site: device online/offline, client co.... | `listSiteEvents` |
| `listSiteThreatManagement` | List site-level threat management events detected by IPS, with opti.... | `listSiteThreatManagement` |
| `listSiteToSiteVpns` | List site-to-site VPN configurations: tunnel name, remote IP, statu.... | `listSiteToSiteVpns` |
| `listSites` | List all sites configured on the Omada controller. | `listSites` |
| `listStaticRoutes` | [DEPRECATED] Use `getGridStaticRouting` instead. This tool aggregates all pages; getGridStaticRouting returns a single paginated page. | `listStaticRoutes` |
| `listSwitchNetworks` | List VLAN network assignments for a switch. | `listSwitchNetworks` |
| `listTimeRangeProfiles` | List time range profiles configured for a site. | `listTimeRangeProfiles` |
| `searchDevices` | Search for devices globally across all sites the user has access to. | `searchDevices` |
| `setClientRateLimit` | Set custom rate limit (bandwidth control) for a specific client. | `setClientRateLimit` |
| `getAclConfigTypeSetting` | Get the ACL configuration type setting for the site gateway (L2 or .... | `getAclConfigTypeSetting` |
| `getAttackDefenseSetting` | Get the DDoS and attack defense configuration, including flood prot.... | `getAttackDefenseSetting` |
| `getAuditLogSettingForGlobal` | Get global audit log notification settings for the controller. | `getAuditLogSettingForGlobal` |
| `getAuditLogSettingForSite` | Get site-level audit log notification settings, including audit eve.... | `getAuditLogSettingForSite` |
| `getAuditLogsForGlobal` | Get global audit logs (paginated). | `getAuditLogsForGlobal` |
| `getBandSteeringSetting` | Get the band steering configuration. | `getBandSteeringSetting` |
| `getBandwidthCtrl` | [DEPRECATED] Use `getBandwidthControl` instead. Get the global bandwidth control configuration for the site. | `getBandwidthControl` |
| `getBeaconControlSetting` | Get the beacon control setting, which manages 802.11 beacon transmi.... | `getBeaconControlSetting` |
| `getChannelLimitSetting` | [DEPRECATED] Get the channel limit setting that restricts which cha.... | `getChannelLimitSetting` |
| `getClientActiveTimeout` | Get the client inactivity timeout setting. | `getClientActiveTimeout` |
| `getClientDetail` | Get full detail for a specific client by MAC address, including con.... | `getClientDetail` |
| `getClientToSiteVpnServerInfo` | Get detailed configuration for a specific client-to-site VPN server.... | `getClientToSiteVpnServerInfo` |
| `getClientsDistribution` | Get client count distribution by connection type and band (wired, 2.... | `getClientsDistribution` |
| `getControllerStatus` | Get the Omada controller health and status, including running state.... | `getControllerStatus` |
| `getDeviceAccessManagement` | Get the device access management settings, controlling which device.... | `getDeviceAccessManagement` |
| `getEapDot1xSetting` | Get the 802.1X EAP setting for access points, controlling port-base.... | `—` |
| `getGeneralSettings` | Get the global general settings for the Omada controller, including.... | `getGeneralSettings` |
| `getGridAllowList` | Get the IPS allow list (paginated). | `getGridAllowList` |
| `getGridAllowMacFiltering` | Get the MAC address allow-list entries (paginated). | `getGridAllowMacFiltering` |
| `getGridBlockList` | Get the IPS block list (paginated). | `getGridBlockList` |
| `getGridClientHistory` | Get per-client connection history (paginated). | `getGridClientHistory` |
| `getGridDenyMacFiltering` | Get the MAC address deny-list entries (paginated). | `getGridDenyMacFiltering` |
| `getGridEapRule` | Get the URL filter AP rules (paginated). | `getGridEapRule` |
| `getGridGatewayRule` | Get the URL filter gateway rules (paginated). | `getGridGatewayRule` |
| `getGridIpsecFailover` | Get IPsec failover configuration (paginated). | `getGridIpsecFailover` |
| `getGridKnownClients` | Get historical known clients list (paginated). | `getGridKnownClients` |
| `getGridSignature` | Get the IPS signature list (paginated). | `getGridSignature` |
| `getGridStaticRouting` | Get static routing rules for the site gateway with explicit pagination. | `getGridStaticRouting` |
| `getGroupProfilesByType` | Get group profiles filtered by type (e.g. | `getGroupProfilesByType` |
| `getIpsConfig` | Get the IPS (Intrusion Prevention System) global configuration, inc.... | `getIpsConfig` |
| `getIpsecVpnStats` | Get IPsec VPN tunnel statistics for a site (paginated), including a.... | `getIpsecVpnStats` |
| `getLdapProfileList` | List all LDAP authentication profiles configured on the site. | `getLdapProfileList` |
| `getLogSettingForGlobal` | Get global log notification settings (v1), including global alert r.... | `getLogSettingForGlobal` |
| `getLogSettingForGlobalV2` | Get global log notification settings (v2), with extended notificati.... | `—` |
| `getLogSettingForSite` | Get site-level log notification settings (v1), including alert reci.... | `getLogSettingForSite` |
| `getLogSettingForSiteV2` | Get site-level log notification settings (v2), with extended notifi.... | `—` |
| `getLogging` | Get the controller logging configuration, including log levels and .... | `getLogging` |
| `getMacAuthSetting` | Get the MAC authentication global setting. | `getMacAuthSetting` |
| `getMacAuthSsids` | Get per-SSID MAC authentication settings showing which SSIDs have M.... | `getMacAuthSsids` |
| `getMacFilteringGeneralSetting` | Get the MAC filtering global setting. | `getMacFilteringGeneralSetting` |
| `getMailServerStatus` | Get the mail server connection status for the controller. | `getMailServerStatus` |
| `getMeshSetting` | Get the mesh networking configuration including mesh topology mode .... | `getMeshSetting` |
| `getOsgCustomAclList` | Get the custom gateway ACL rules list (paginated). | `getOsgCustomAclList` |
| `getOswAclList` | Get the switch ACL list (paginated). | `getOswAclList` |
| `getOuiProfileList` | Get the OUI-based device profile list (paginated). | `getOuiProfileList` |
| `getPPSKProfiles` | List Private PSK (PPSK) profiles for the site by type. | `getPPSKProfiles` |
| `getPastClientNum` | Get historical client count trend over a time range. | `getPastClientNum` |
| `getRadioFrequencyPlanningConfig` | Get the RF planning configuration for the site, including frequency.... | `getRadioFrequencyPlanningConfig` |
| `getRadioFrequencyPlanningResult` | Get the RF planning result for the site. | `getRadioFrequencyPlanningResult` |
| `getRadiusServer` | Get the global RADIUS server configuration for the controller. | `getRadiusServer` |
| `getRadiusUserList` | List local RADIUS server users (paginated). | `getRadiusUserList` |
| `getRemoteLogging` | Get the global syslog/remote logging configuration, including syslo.... | `getRemoteLogging` |
| `getRetention` | Get the data retention configuration for the controller, including .... | `getRetention` |
| `getRoamingSetting` | Get the client roaming configuration, including 802.11r/k/v setting.... | `getRoamingSetting` |
| `getRoutingTable` | Get the live routing table for a site filtered by type. | `getRoutingTable` |
| `getServiceTypeSummary` | Get a summary of service type profiles for the site, including pred.... | `getServiceTypeSummary` |
| `getSiteToSiteVpnInfo` | Get detailed information about a specific site-to-site VPN by ID, i.... | `getSiteToSiteVpnInfo` |
| `getSsidsBySite` | Get a flat SSID list filtered by device type. | `getSsidsBySite` |
| `getSslVpnServerSetting` | Get the SSL VPN server configuration, including port, protocol, and.... | `getSslVpnServerSetting` |
| `getSwitchDot1xSetting` | Get the 802.1X switch port authentication setting. | `—` |
| `getThreatCount` | Get the global threat count grouped by severity level (critical, hi.... | `getThreatSeverity` |
| `getThreatDetail` | Get detailed information about a specific IPS threat event by its ID. | `getThreatDetail` |
| `getUiInterface` | Get the UI interface settings for the controller, including timeout.... | `getUiInterface` |
| `getUrlFilterGeneral` | Get the URL filter global setting, including whether URL filtering .... | `getUrlFilterGeneral` |
| `getWebhookForGlobal` | Get the global webhook notification settings, including webhook URL.... | `getWebhookForGlobal` |
| `getWebhookLogsForGlobal` | Get webhook dispatch logs (paginated). | `getWebhookLogsForGlobal` |
| `getWidsBlacklist` | Get the WIPS (Wireless Intrusion Prevention System) rogue AP blackl.... | `getWidsBlacklist` |
| `getWireguardSummary` | Get a summary of WireGuard VPN configurations for the site, includi.... | `getWireguardSummary` |
| `listClientToSiteVpnClients` | List all client-to-site VPN client configurations on the site. | `listClientToSiteVpnClients` |
| `listClientToSiteVpnServers` | List all client-to-site VPN server configurations on the site, incl.... | `listClientToSiteVpnServers` |
| `listDevicesStats` | Query statistics for global adopted devices with pagination and fil.... | `listDevicesStats` |
| `listMdnsProfile` | List all Bonjour/mDNS service profiles configured on the site for c.... | `listMdnsProfile` |
| `listServiceType` | List service type profiles (paginated). | `listServiceType` |
| `listWireguard` | List WireGuard VPN tunnels (paginated). | `listWireguard` |
| `listWireguardPeers` | List WireGuard peers (paginated). | `listWireguardPeers` |
| `getDashboardMostActiveEaps` | Get the most active access points from the site dashboard by traffic. | `getDashboardMostActiveEaps` |
| `getDashboardTopMemoryUsage` | Get top memory usage data for devices from the site dashboard. | `getDashboardTopMemoryUsage` |
| `getDashboardTrafficActivities` | Get traffic activity data and throughput summary from the site dashboard. | `getDashboardTrafficActivities` |
| `getGridDashboardTunnelStats` | Get VPN tunnel statistics for the grid dashboard view. | `getGridDashboardTunnelStats` |
| `setClientRateLimitProfile` | Apply a predefined rate limit profile to a specific client. | `setClientRateLimitProfile` |
| `getGatewayQosClassRules` | Get gateway QoS class rules (paginated). | `getGatewayQosClassRules` |
| `getBandwidthCtrlDetail` | Get bandwidth control details for a site. | `getBandwidthCtrlDetail` |
| `getAppControlRules` | Get application control rules (paginated). | `getAppControlRules` |
| `getAppControlCategories` | Get application control category list. | `getAppControlCategories` |
| `getQosPolicy` | Get QoS policy configuration for a site. | `getQosPolicy` |
| `getTrafficPriority` | Get traffic priority rules for a site. | `getTrafficPriority` |
| `getVpnUserList` | Get VPN users for a site (paginated). | `getVpnUserList` |
| `getVpnUserDetail` | Get users for a specific client-to-site VPN server by ID. | `getVpnUserDetail` |
| `getGoogleLdapProfile` | Get Google LDAP profile configuration for a site. | `getGoogleLdapProfile` |
| `getPpskUserGroup` | Get PPSK user group details for a specific profile ID. | `getPpskUserGroup` |
| `getPortalProfile` | Get captive portal profiles for a site. | `getPortalProfile` |
| `getUserRoleProfile` | Get user role profiles from the controller (global). | `getUserRoleProfile` |
| `getRadiusProxyConfig` | Get global RADIUS proxy configuration (controller-level). | `getRadiusProxyConfig` |
| `getSiteEntity` | Get site detail. | `getSiteDetail` |
| `getSiteUrlByOpenApi` | Get site URL. | `getSiteUrl` |
| `getNtpServerStatus` | Get NTP server status for a site. | `getSiteNtpStatus` |
| `getSiteSpecification` | Get site specification. | `getSiteSpecification` |
| `getSiteRememberSettingByOpenApi` | Get site remember device setting. | `getSiteRememberSetting` |
| `getSiteDeviceAccountSetting` | Get site device account setting. | `getSiteDeviceAccount` |
| `getSiteSettingCap` | Get site capacity setting. | `getSiteCapacity` |
| `getSiteTemplateList` | List site templates. | `getSiteTemplateList` |
| `getSiteTemplateEntity` | Get site template detail. | `getSiteTemplateDetail` |
| `getSiteTemplateConfiguration` | Get site template configuration. | `getSiteTemplateConfig` |
| `getDataRetention` | Get data retention settings. | `getDataRetention` |
| `getControllerPort` | Get controller port setting. | `getControllerPort` |
| `getPortalPort` | Get portal port setting. | `getPortalPort` |
| `getCertificate` | Get certificate configuration. | `getCertificate` |
| `getExpImprove` | Get experience improvement setting. | `getExperienceImprovement` |
| `getGernalSettings_1` | Get global dashboard overview without client data. | `getGlobalDashboardOverview` |
| `getClientHistoryDataEnable` | Get client history data enable setting. | `getClientHistoryDataEnable` |
| `getSelfServerFileList` | List controller backup files. | `getBackupFileList` |
| `getBackupResult` | Get controller backup result. | `getBackupResult` |
| `getRestoreResult` | Get controller restore result. | `getRestoreResult` |
| `getSiteBackupResult` | Get site backup result. | `getSiteBackupResult` |
| `getSelfServerSiteFileList` | List site backup files. | `getSiteBackupFileList` |
| `getAllCloudUsersExcludeRoot` | List all cloud users excluding root. | `getAllCloudUsers` |
| `getAllLocalUsersExcludeRoot` | List all local users excluding root. | `getAllLocalUsers` |
| `getAllRoles` | [DEPRECATED] Use `getUserRoleProfile` instead. List all roles. | `getAllRoles` |
| `getRole` | Get role detail. | `getRoleDetail` |
| `getAvailableRole` | List available roles. | `getAvailableRoles` |
| `getAppGridUsers` | List all users in app grid view. | `getAllUsersApp` |
| `getCloudAccessStatus` | Get cloud access status. | `getCloudAccessStatus` |
| `getCloudUserInfo` | Get cloud user info. | `getCloudUserInfo` |
| `getGlobalMFAStatus` | Get global MFA status. | `getMfaStatus` |
| `getRemoteBindingStatus` | Get remote binding status. | `getRemoteBindingStatus` |
| `getUpgradeScheduleList` | List upgrade schedules for a site. | `getUpgradeScheduleList` |
| `getRebootScheduleList_1` | List reboot schedules for a site template. | `getRebootScheduleList` |
| `getPoeScheduleList` | List PoE schedules for a site. | `getPoeScheduleList` |
| `getPortScheduleList` | List port schedules for a site. | `getPortScheduleList` |
| `getPortSchedulePorts` | List ports with port schedules. | `getPortSchedulePorts` |
| `getMulticastRateLimitByOpenApi` | Get multicast rate limit setting. | `getMulticastRateLimit` |
| `getApLoadBalanceConfig` | Get AP load balance configuration. | `getApLoadBalance` |
| `getApOfdmaConfig` | [DEPRECATED] Use `getSitesApsOfdma` instead. Same endpoint, retained for backward compatibility. getSitesApsOfdma is the canonical tool name. | `getApOfdmaConfig` |

## Devcontainer support

The repository includes a ready-to-use [devcontainer](https://containers.dev/) configuration with a dedicated Omada controller sidecar for local development and testing. See [`.devcontainer/README.md`](.devcontainer/README.md) for details.

## License

This project is licensed under the [MIT License](LICENSE).
