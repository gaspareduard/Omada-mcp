import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetFirewallSettingTool } from '../../src/tools/setFirewallSetting.js';

describe('tools/setFirewallSetting', () => {
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
            getFirewallSetting: vi.fn().mockResolvedValue({ spi: true }),
            setFirewallSetting: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview with the current firewall settings', async () => {
        registerSetFirewallSettingTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                payload: { spi: false },
                dryRun: true,
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setFirewallSetting).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'set-firewall-setting',
                target: 'site-1',
                siteId: 'site-1',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned firewall settings update.',
                result: {
                    accepted: true,
                    dryRun: true,
                    before: { spi: true },
                    plannedConfig: { spi: false },
                },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('applies firewall settings through the client', async () => {
        registerSetFirewallSettingTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, payload: { spi: false }, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.setFirewallSetting).toHaveBeenCalledWith({ spi: false }, 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerSetFirewallSettingTool(mockServer, mockClient);
        const result = (await toolHandler({ payload: { spi: false }, siteId: 'site-1' }, { sessionId: 'preview' })) as {
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
