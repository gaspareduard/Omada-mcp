import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';

import { registerCallApiTool } from './callApi.js';
import { registerGetClientTool } from './getClient.js';
import { registerGetDeviceTool } from './getDevice.js';
import { registerGetSwitchStackDetailTool } from './getSwitchStackDetail.js';
import { registerListClientsTool } from './listClients.js';
import { registerListDevicesTool } from './listDevices.js';
import { registerListDevicesStatsTool } from './listDevicesStats.js';
import { registerListSitesTool } from './listSites.js';
import { registerSearchDevicesTool } from './searchDevices.js';

export function registerAllTools(server: McpServer, client: OmadaClient): void {
    registerListSitesTool(server, client);
    registerListDevicesTool(server, client);
    registerListClientsTool(server, client);
    registerGetDeviceTool(server, client);
    registerGetSwitchStackDetailTool(server, client);
    registerGetClientTool(server, client);
    registerSearchDevicesTool(server, client);
    registerListDevicesStatsTool(server, client);
    registerCallApiTool(server, client);
}
