/* c8 ignore file */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';

export interface ToolRegistration {
    register(server: McpServer, client: OmadaClient): void;
}
