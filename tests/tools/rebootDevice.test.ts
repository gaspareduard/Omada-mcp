import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerRebootDeviceTool } from '../../src/tools/rebootDevice.js';

describe('tools/rebootDevice', () => {
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
            rebootDevice: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('registers the rebootDevice tool', () => {
        registerRebootDeviceTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('rebootDevice', expect.any(Object), expect.any(Function));
    });

    it('returns a dry-run summary without calling the controller', async () => {
        registerRebootDeviceTool(mockServer, mockClient);
        const result = await toolHandler({ deviceMac: 'AA:BB:CC:DD:EE:FF', dryRun: true }, { sessionId: 's1' });
        expect(mockClient.rebootDevice).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'reboot-device',
                target: 'AA:BB:CC:DD:EE:FF',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned reboot for device AA:BB:CC:DD:EE:FF.',
                result: { accepted: true, dryRun: true },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('calls the controller when not in dry-run mode', async () => {
        registerRebootDeviceTool(mockServer, mockClient);
        await toolHandler({ dryRun: false, deviceMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.rebootDevice).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerRebootDeviceTool(mockServer, mockClient);
        const result = (await toolHandler({ deviceMac: 'AA:BB:CC:DD:EE:FF' }, { sessionId: 'preview' })) as {
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
