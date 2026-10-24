import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetAclConfigTypeSettingTool } from '../../src/tools/setAclConfigTypeSetting.js';

describe('tools/setAclConfigTypeSetting', () => {
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
            getAclConfigTypeSetting: vi.fn().mockResolvedValue({ mode: 1 }),
            setAclConfigTypeSetting: vi.fn().mockResolvedValue({ mode: 0 }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary', async () => {
        registerSetAclConfigTypeSettingTool(mockServer, mockClient);

        const result = await toolHandler({ mode: 0, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.setAclConfigTypeSetting).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'set-acl-config-type-setting',
                target: 'default-site',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned ACL config mode update.',
                result: { accepted: true, dryRun: true, before: { mode: 1 }, plannedConfig: { mode: 0 } },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('updates the config type mode through the client', async () => {
        registerSetAclConfigTypeSettingTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, mode: 0, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.setAclConfigTypeSetting).toHaveBeenCalledWith({ mode: 0 }, 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerSetAclConfigTypeSettingTool(mockServer, mockClient);
        const result = (await toolHandler({ mode: 0 }, { sessionId: 'preview' })) as {
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
