import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateSiteToSiteVpnTool } from '../../src/tools/updateSiteToSiteVpn.js';

const payload = { name: 'mcp-test', siteVpnType: 0, status: true };
const current = { name: 'mcp-test', siteVpnType: 0, status: false, id: 'id-1' };

describe('tools/updateSiteToSiteVpn', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listSiteToSiteVpns: vi.fn(async () => state),
            updateSiteToSiteVpn: vi.fn(() => {
                state = [{ name: 'mcp-test', siteVpnType: 0, status: true, id: 'id-1' }];
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerUpdateSiteToSiteVpnTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ vpnId: 'id-1', payload }, {});
        expect(client.updateSiteToSiteVpn).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ vpnId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateSiteToSiteVpn).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ vpnId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No site-to-site VPN with id "missing"');
        expect(client.updateSiteToSiteVpn).not.toHaveBeenCalled();
    });
});
