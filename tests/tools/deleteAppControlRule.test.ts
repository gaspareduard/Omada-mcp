import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteAppControlRuleTool } from '../../src/tools/deleteAppControlRule.js';

describe('tools/deleteAppControlRule', () => {
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
            getAppControlRules: vi.fn().mockResolvedValue({ data: [{ ruleId: 10, ruleName: 'Old rule' }] }),
            deleteAppControlRule: vi.fn().mockResolvedValue({ ok: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview', async () => {
        registerDeleteAppControlRuleTool(mockServer, mockClient);

        const result = await toolHandler({ ruleId: '10', dryRun: true }, { sessionId: 's1' });

        expect(mockClient.deleteAppControlRule).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'delete-app-control-rule',
                target: '10',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned application control rule deletion for 10.',
                result: {
                    accepted: true,
                    dryRun: true,
                    before: { ruleId: 10, ruleName: 'Old rule' },
                },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('deletes the app control rule through the client', async () => {
        registerDeleteAppControlRuleTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, ruleId: '10', siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.deleteAppControlRule).toHaveBeenCalledWith('10', 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerDeleteAppControlRuleTool(mockServer, mockClient);
        const result = (await toolHandler({ ruleId: '10' }, { sessionId: 'preview' })) as {
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
