import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetAppControlRuleTool } from '../../src/tools/setAppControlRule.js';

describe('tools/setAppControlRule', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const payload = {
        ruleName: 'Block social',
        schedule: 'always',
        qos: false,
        applications: [1001],
        selectType: 'include',
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getAppControlRules: vi.fn().mockResolvedValue({ data: [{ ruleId: 10, ruleName: 'Old rule' }] }),
            getApplications: vi.fn().mockResolvedValue({ data: [{ applicationId: 1001 }] }),
            createAppControlRule: vi.fn().mockResolvedValue({ ruleId: 11 }),
            updateAppControlRule: vi.fn().mockResolvedValue({ ruleId: 10 }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview for creates', async () => {
        registerSetAppControlRuleTool(mockServer, mockClient);

        const result = await toolHandler({ payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.createAppControlRule).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'create-app-control-rule',
                            target: 'default-site',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned application control rule mutation.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: undefined,
                                plannedRule: payload,
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('throws when updating a missing app control rule', async () => {
        registerSetAppControlRuleTool(mockServer, mockClient);

        await expect(toolHandler({ ruleId: 'missing', payload }, { sessionId: 's1' })).rejects.toThrow(
            'No application control rule exists for missing.'
        );
    });

    it('accepts update payloads without selectType', async () => {
        registerSetAppControlRuleTool(mockServer, mockClient);

        const updatePayload = {
            ruleName: 'Updated social',
            schedule: 'always',
            qos: false,
            applications: [1001],
        };

        await toolHandler({ ruleId: '10', payload: updatePayload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.updateAppControlRule).toHaveBeenCalledWith('10', updatePayload, 'site-1', undefined);
    });

    it('rejects unknown application ids before mutating', async () => {
        registerSetAppControlRuleTool(mockServer, mockClient);
        vi.mocked(mockClient.getApplications).mockResolvedValue({ data: [{ applicationId: 999 }] } as never);

        await expect(toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' })).rejects.toThrow('Unknown application ids: 1001.');
        expect(mockClient.createAppControlRule).not.toHaveBeenCalled();
    });

    it('routes create and update calls to the client', async () => {
        registerSetAppControlRuleTool(mockServer, mockClient);

        await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.createAppControlRule).toHaveBeenCalledWith(payload, 'site-1', undefined);

        await toolHandler({ ruleId: '10', payload, siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.updateAppControlRule).toHaveBeenCalledWith(
            '10',
            {
                ruleName: 'Block social',
                schedule: 'always',
                qos: false,
                applications: [1001],
            },
            'site-1',
            undefined
        );
    });
});
