import { describe, expect, it, vi } from 'vitest';

import { registerCallApiTool } from '../../src/tools/callApi.js';

describe('registerCallApiTool', () => {
    const createToolExtra = () => {
        const controller = new AbortController();
        return {
            signal: controller.signal,
            requestId: 'req-1',
            sendNotification: vi.fn(),
            sendRequest: vi.fn(),
        };
    };

    it('registers the tool and proxies requests to the client API', async () => {
        const registerTool = vi.fn();
        const server = { registerTool } as unknown as import('@modelcontextprotocol/sdk/server/mcp.js').McpServer;
        const callApi = vi.fn().mockResolvedValue({ ok: true, value: 42 });
        const client = { callApi } as unknown as import('../../src/omadaClient/index.js').OmadaClient;

        registerCallApiTool(server, client);

        expect(registerTool).toHaveBeenCalledWith(
            'callApi',
            expect.objectContaining({
                description: expect.stringContaining('Call an arbitrary API path'),
                inputSchema: expect.objectContaining({
                    method: expect.anything(),
                    url: expect.anything(),
                }),
            }),
            expect.any(Function)
        );

        const handler = registerTool.mock.calls[0][2];
        const result = await handler(
            {
                method: 'POST',
                url: '/openapi/v1/{siteId}/devices',
                params: { limit: 5 },
                data: { foo: 'bar' },
                siteId: 'site-123',
            },
            createToolExtra()
        );

        expect(callApi).toHaveBeenCalledWith({
            method: 'POST',
            url: '/openapi/v1/site-123/devices',
            params: { limit: 5 },
            data: { foo: 'bar' },
        });
        expect(result.content).toHaveLength(1);
        const output = result.content?.[0];
        expect(output).toMatchObject({ type: 'text' });
        expect(JSON.parse(output?.text ?? '')).toEqual({ ok: true, value: 42 });
    });
});
