import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteAppControlRuleTool } from '../../src/tools/deleteAppControlRule.js';

describe('tools/deleteAppControlRule', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
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
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
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
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('deletes the app control rule through the client', async () => {
        registerDeleteAppControlRuleTool(mockServer, mockClient);

        await toolHandler({ ruleId: '10', siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.deleteAppControlRule).toHaveBeenCalledWith('10', 'site-1', undefined);
    });
});
