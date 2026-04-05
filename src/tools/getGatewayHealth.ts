import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import type { OmadaDeviceInfo } from '../types/index.js';

const GATEWAY_TYPES = new Set(['gateway', '3', 3]);

function isGateway(device: OmadaDeviceInfo): boolean {
    return GATEWAY_TYPES.has(device.type as string | number) || String(device.type).toLowerCase() === 'gateway';
}

const inputSchema = z.object({
    siteId: z.string().optional().describe('Optional site ID. Uses default site if omitted.'),
    gatewayMac: z
        .string()
        .optional()
        .describe('Optional gateway MAC address. If omitted, the gateway is discovered automatically by listing site devices.'),
    customHeaders: customHeadersSchema,
});

export function registerGetGatewayHealthTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGatewayHealth',
        {
            description:
                'Composite gateway health check — single call that auto-discovers the site gateway then retrieves its full detail (CPU, memory, firmware, ports), WAN port statuses (link state, IP, ISP), and LAN interface statuses. Use when diagnosing internet connectivity issues, WAN failover, or gateway performance problems. Optionally accepts a gatewayMac to skip discovery.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGatewayHealth', async ({ siteId, gatewayMac, customHeaders }) => {
            let resolvedMac = gatewayMac;

            // Auto-discover gateway MAC if not provided
            if (!resolvedMac) {
                const devices = await client.listDevices(siteId, customHeaders);
                const gateway = devices.find(isGateway);
                resolvedMac = gateway?.mac;
            }

            if (!resolvedMac) {
                return toToolResult({
                    _error: 'No gateway device found on this site. Provide gatewayMac explicitly or check that a gateway is adopted.',
                    devices: null,
                });
            }

            const [detail, wanStatus, lanStatus, ports] = await Promise.allSettled([
                client.getGatewayDetail(resolvedMac, siteId, customHeaders),
                client.getGatewayWanStatus(resolvedMac, siteId, customHeaders),
                client.getGatewayLanStatus(resolvedMac, siteId, customHeaders),
                client.getGatewayPorts(resolvedMac, siteId, customHeaders),
            ]);

            return toToolResult({
                gatewayMac: resolvedMac,
                detail: detail.status === 'fulfilled' ? detail.value : { _error: String(detail.reason) },
                wanStatus: wanStatus.status === 'fulfilled' ? wanStatus.value : { _error: String(wanStatus.reason) },
                lanStatus: lanStatus.status === 'fulfilled' ? lanStatus.value : { _error: String(lanStatus.reason) },
                ports: ports.status === 'fulfilled' ? ports.value : { _error: String(ports.reason) },
            });
        })
    );
}
