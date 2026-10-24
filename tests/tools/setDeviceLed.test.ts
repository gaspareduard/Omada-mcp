import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetDeviceLedTool } from '../../src/tools/setDeviceLed.js';

describe('tools/setDeviceLed', () => {
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
            setDeviceLed: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('calls the set device LED action when not in dry-run mode', async () => {
        registerSetDeviceLedTool(mockServer, mockClient);
        await toolHandler({ dryRun: false, deviceMac: 'AA:BB:CC:DD:EE:FF', ledSetting: 1, siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.setDeviceLed).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 1, 'site-1', undefined);
    });

    it('returns a dry-run summary without calling the controller', async () => {
        registerSetDeviceLedTool(mockServer, mockClient);
        const result = await toolHandler({ deviceMac: 'AA:BB:CC:DD:EE:FF', ledSetting: 2, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.setDeviceLed).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'set-device-led',
                target: 'AA:BB:CC:DD:EE:FF',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned LED setting 2 for device AA:BB:CC:DD:EE:FF.',
                result: { accepted: true, dryRun: true, ledSetting: 2 },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerSetDeviceLedTool(mockServer, mockClient);
        const result = (await toolHandler({ deviceMac: 'AA:BB:CC:DD:EE:FF', ledSetting: 1, siteId: 'site-1' }, { sessionId: 'preview' })) as {
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
