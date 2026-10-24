import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerReconnectClientTool } from '../../src/tools/reconnectClient.js';

describe('tools/reconnectClient', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
            }),
        } as unknown as McpServer;

        mockClient = {
            reconnectClient: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('calls the reconnect client action when not in dry-run mode', async () => {
        registerReconnectClientTool(mockServer, mockClient);
        await toolHandler({ dryRun: false, clientMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.reconnectClient).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
    });

    it('returns a dry-run summary without calling the controller', async () => {
        registerReconnectClientTool(mockServer, mockClient);
        const result = await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', dryRun: true }, { sessionId: 's1' });

        expect(mockClient.reconnectClient).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'reconnect-client',
                target: 'AA:BB:CC:DD:EE:FF',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned client reconnect for AA:BB:CC:DD:EE:FF.',
                result: { accepted: true, dryRun: true },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerReconnectClientTool(mockServer, mockClient);
        const result = (await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1' }, { sessionId: 'preview' })) as {
            content: { text: string }[];
            structuredContent: Record<string, unknown>;
        };
        const summary = JSON.parse(result.content[0].text);
        expect(summary).toMatchObject({ mode: 'dry-run', status: 'planned' });
        expect(result.structuredContent).toEqual(expect.objectContaining(summary));
        for (const [name, operation] of Object.entries(mockClient)) {
            if (!/^(get|list|resolve)/.test(name)) expect(operation).not.toHaveBeenCalled();
        }
    });
});
