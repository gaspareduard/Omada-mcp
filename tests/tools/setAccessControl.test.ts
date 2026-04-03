import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetAccessControlTool } from '../../src/tools/setAccessControl.js';

describe('tools/setAccessControl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const payload = {
        preAuthAccessEnable: true,
        preAuthAccessPolicies: [{ type: 2, url: 'example.com' }],
        freeAuthClientEnable: false,
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getAccessControl: vi.fn().mockResolvedValue({ preAuthAccessEnable: false, freeAuthClientEnable: false }),
            setAccessControl: vi.fn().mockResolvedValue({ ok: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview', async () => {
        registerSetAccessControlTool(mockServer, mockClient);

        const result = await toolHandler({ payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.setAccessControl).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'set-access-control',
                            target: 'default-site',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned portal access control update.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: { preAuthAccessEnable: false, freeAuthClientEnable: false },
                                plannedConfig: payload,
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('updates access control through the client', async () => {
        registerSetAccessControlTool(mockServer, mockClient);

        await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.setAccessControl).toHaveBeenCalledWith(payload, 'site-1', undefined);
    });
});
