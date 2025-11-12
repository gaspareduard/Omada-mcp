import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';

import { registerCallApiTool } from './callApi.js';
import { registerGetClientTool } from './getClient.js';
import { registerGetDeviceTool } from './getDevice.js';
import { registerGetSwitchStackDetailTool } from './getSwitchStackDetail.js';
import { registerGetThreatListTool } from './getThreatList.js';
import { registerListClientsTool } from './listClients.js';
import { registerListClientsActivityTool } from './listClientsActivity.js';
import { registerListClientsPastConnectionsTool } from './listClientsPastConnections.js';
import { registerListDevicesTool } from './listDevices.js';
import { registerListDevicesStatsTool } from './listDevicesStats.js';
import { registerListMostActiveClientsTool } from './listMostActiveClients.js';
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
    registerListMostActiveClientsTool(server, client);
    registerListClientsActivityTool(server, client);
    registerListClientsPastConnectionsTool(server, client);
    registerGetThreatListTool(server, client);
    registerCallApiTool(server, client);
}
