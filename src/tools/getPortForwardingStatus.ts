import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

/**
 * Normalises the port forwarding type string to the exact casing required by
 * the Omada API ('User' or 'UPnP'), regardless of what the AI model sends.
 */
/**
 * Despite the OpenAPI spec listing 'User' and 'UPnP', the Omada controller
 * actually expects lowercase values ('user' and 'upnp') in the URL path.
 * This function accepts any casing from the AI model and returns the correct
 * lowercase value for the API call.
 */
function normalisePortForwardingType(raw: string): 'user' | 'upnp' | null {
    switch (raw.toLowerCase()) {
        case 'user':
            return 'user';
        case 'upnp':
            return 'upnp';
        default:
            return null;
    }
}

export function registerGetPortForwardingStatusTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        type: z.string().describe('Port forwarding type: "User" (manually configured) or "UPnP" (automatically configured). Case-insensitive.'),
        ...siteInputSchema.shape,
        ...createPaginationSchema(10),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getPortForwardingStatus',
        {
            description:
                'Get port forwarding status and rules for a site. Retrieves either User-configured or UPnP-discovered port forwarding rules. Both page and pageSize parameters are required by the API. Call this tool twice (once with type="User" and once with type="UPnP") to get complete port forwarding information.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getPortForwardingStatus', async ({ type, siteId, page = 1, pageSize = 10, customHeaders }) => {
            const normalisedType = normalisePortForwardingType(type);
            if (!normalisedType) {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Invalid type "${type}". Valid values are "User" or "UPnP" (case-insensitive).`,
                        },
                    ],
                    isError: true,
                };
            }
            return toToolResult(await client.getPortForwardingStatus(normalisedType, siteId, page, pageSize, customHeaders));
        })
    );
}
