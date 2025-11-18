import { describe, expect, it, vi } from 'vitest';

import { registerSearchDevicesTool } from '../../src/tools/searchDevices.js';

describe('registerSearchDevicesTool', () => {
    const createToolExtra = () => {
        const controller = new AbortController();
        return {
            signal: controller.signal,
            requestId: 'req-1',
            sendNotification: vi.fn(),
            sendRequest: vi.fn(),
        };
    };

    it('registers search tool and forwards to client', async () => {
        const registerTool = vi.fn();
        const server = { registerTool } as unknown as import('@modelcontextprotocol/sdk/server/mcp.js').McpServer;
        const client = {
            searchDevices: vi.fn().mockResolvedValue([{ name: 'Switch-01' }]),
        } as unknown as import('../../src/omadaClient/index.js').OmadaClient;

        registerSearchDevicesTool(server, client);

        expect(registerTool).toHaveBeenCalledWith(
            'searchDevices',
            expect.objectContaining({
                description: expect.stringContaining('Search for devices'),
                inputSchema: expect.objectContaining({ searchKey: expect.anything() }),
            }),
            expect.any(Function)
        );

        const handler = registerTool.mock.calls[0][2];
        const result = await handler({ searchKey: 'Switch' }, createToolExtra());

        expect(client.searchDevices).toHaveBeenCalledWith('Switch');
        expect(result.content).toHaveLength(1);
        const output = result.content?.[0];
        expect(output).toMatchObject({ type: 'text' });
        expect(JSON.parse(output?.text ?? '')).toEqual([{ name: 'Switch-01' }]);
    });
});
