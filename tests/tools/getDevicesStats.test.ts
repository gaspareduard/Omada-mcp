import { describe, expect, it, vi } from 'vitest';

import { registerListDevicesStatsTool } from '../../src/tools/getDevicesStats.js';

describe('registerListDevicesStatsTool', () => {
    const createToolExtra = () => {
        const controller = new AbortController();
        return {
            signal: controller.signal,
            requestId: 'req-1',
            sendNotification: vi.fn(),
            sendRequest: vi.fn(),
        };
    };

    it('registers the tool with schema and delegates to client', async () => {
        const registerTool = vi.fn();
        const server = { registerTool } as unknown as import('@modelcontextprotocol/sdk/server/mcp.js').McpServer;
        const payload = { totalRows: 1, data: [] };
        const client = {
            listDevicesStats: vi.fn().mockResolvedValue(payload),
        } as unknown as import('../../src/omadaClient/index.js').OmadaClient;

        registerListDevicesStatsTool(server, client);

        expect(registerTool).toHaveBeenCalledWith(
            'listDevicesStats',
            expect.objectContaining({
                description: expect.stringContaining('statistics'),
                inputSchema: expect.objectContaining({ page: expect.anything(), pageSize: expect.anything() }),
            }),
            expect.any(Function)
        );

        const handler = registerTool.mock.calls[0][2];
        const result = await handler(
            {
                page: 2,
                pageSize: 50,
                searchMacs: 'AA:BB',
                searchNames: 'Switch',
                searchModels: 'TL',
                searchSns: 'SN123',
                filterTag: 'datacenter',
                filterDeviceSeriesType: '1',
            },
            createToolExtra()
        );

        expect(client.listDevicesStats).toHaveBeenCalledWith(
            {
                page: 2,
                pageSize: 50,
                searchMacs: 'AA:BB',
                searchNames: 'Switch',
                searchModels: 'TL',
                searchSns: 'SN123',
                filterTag: 'datacenter',
                filterDeviceSeriesType: '1',
            },
            undefined
        );
        expect(result.content).toHaveLength(1);
        const output = result.content?.[0];
        expect(output).toMatchObject({ type: 'text' });
        expect(JSON.parse(output?.text ?? '')).toEqual(payload);
    });
});
