import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateWireguardTool } from '../../src/tools/updateWireguard.js';

const payload = { name: 'mcp-test', status: true, listenPort: 51820, localIp: '10.66.0.1', mtu: 1420, privateKey: 'not-a-real-key' };
const current = { name: 'mcp-test', status: true, listenPort: 51821, localIp: '10.66.0.1', mtu: 1420, privateKey: 'not-a-real-key', id: 'id-1' };

describe('tools/updateWireguard', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listWireguardTunnels: vi.fn(async () => state),
            updateWireguard: vi.fn(() => {
                state = [{ name: 'mcp-test', status: true, listenPort: 51820, localIp: '10.66.0.1', mtu: 1420, id: 'id-1' }];
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerUpdateWireguardTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ wireguardId: 'id-1', payload }, {});
        expect(client.updateWireguard).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ wireguardId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateWireguard).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ wireguardId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No WireGuard interface with id "missing"');
        expect(client.updateWireguard).not.toHaveBeenCalled();
    });
});
