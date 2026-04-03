import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateGatewayAclTool } from '../../src/tools/updateGatewayAcl.js';

describe('tools/updateGatewayAcl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const payload = {
        description: 'Guests allow WAN',
        status: true,
        policy: 1,
        protocols: [6],
        sourceIds: ['net-guests'],
        sourceType: 0,
        destinationType: 0,
        direction: { lanToWan: true },
        stateMode: 0,
        syslog: false,
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            listOsgAcls: vi.fn().mockResolvedValue([{ id: 'acl-1', description: 'Old' }]),
            updateOsgAcl: vi.fn().mockResolvedValue({ ok: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary for an existing ACL', async () => {
        registerUpdateGatewayAclTool(mockServer, mockClient);

        const result = await toolHandler({ aclId: 'acl-1', payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.updateOsgAcl).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'update-gateway-acl',
                            target: 'acl-1',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned gateway ACL update for acl-1.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: { id: 'acl-1', description: 'Old' },
                                plannedAcl: payload,
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('throws when the ACL does not exist', async () => {
        vi.mocked(mockClient.listOsgAcls).mockResolvedValue([] as never);
        registerUpdateGatewayAclTool(mockServer, mockClient);

        await expect(toolHandler({ aclId: 'missing', payload }, { sessionId: 's1' })).rejects.toThrow('No gateway ACL exists for missing.');
    });

    it('updates the gateway ACL through the client', async () => {
        registerUpdateGatewayAclTool(mockServer, mockClient);

        await toolHandler({ aclId: 'acl-1', payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.updateOsgAcl).toHaveBeenCalledWith('acl-1', payload, 'site-1', undefined);
    });
});
