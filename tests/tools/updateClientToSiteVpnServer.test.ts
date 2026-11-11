import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateClientToSiteVpnServerTool } from '../../src/tools/updateClientToSiteVpnServer.js';

const payload = { name: 'mcp-test', clientVpnType: 0, wan: ['wan-1'], ipPool: { ipPool: '10.99.0.0', mask: 24 } };
const current = { name: 'mcp-old', clientVpnType: 0, wan: ['wan-1'], ipPool: { ipPool: '10.99.0.0', mask: 24 }, id: 'id-1' };

describe('tools/updateClientToSiteVpnServer', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listClientToSiteVpnServers: vi.fn(async () => state),
            updateClientToSiteVpnServer: vi.fn(() => {
                state = [{ name: 'mcp-test', clientVpnType: 0, wan: ['wan-1'], ipPool: { ipPool: '10.99.0.0', mask: 24 }, id: 'id-1' }];
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerUpdateClientToSiteVpnServerTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ vpnId: 'id-1', payload }, {});
        expect(client.updateClientToSiteVpnServer).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ vpnId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateClientToSiteVpnServer).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ vpnId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No client-to-site VPN server with id "missing"');
        expect(client.updateClientToSiteVpnServer).not.toHaveBeenCalled();
    });
});
