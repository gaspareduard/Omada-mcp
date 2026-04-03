import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteAclTool } from '../../src/tools/deleteAcl.js';

describe('tools/deleteAcl', () => {
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
            listOsgAcls: vi.fn().mockResolvedValue([{ id: 'acl-1', description: 'Gateway ACL' }]),
            listEapAcls: vi.fn().mockResolvedValue([{ id: 'acl-2', description: 'EAP ACL' }]),
            deleteAcl: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary before deleting a gateway ACL', async () => {
        registerDeleteAclTool(mockServer, mockClient);

        const result = await toolHandler({ aclId: 'acl-1', dryRun: true }, { sessionId: 's1' });

        expect(mockClient.deleteAcl).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'delete-acl',
                            target: 'acl-1',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned ACL deletion for acl-1.',
                            result: { accepted: true, dryRun: true, before: { id: 'acl-1', description: 'Gateway ACL' } },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('deletes EAP ACLs through the shared delete endpoint', async () => {
        registerDeleteAclTool(mockServer, mockClient);

        await toolHandler({ aclId: 'acl-2', siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.deleteAcl).toHaveBeenCalledWith('acl-2', 'site-1', undefined);
    });

    it('tolerates unrelated ACL family lookup errors when the target ACL exists', async () => {
        vi.mocked(mockClient.listOsgAcls).mockRejectedValueOnce(new Error('General error.'));
        registerDeleteAclTool(mockServer, mockClient);

        await toolHandler({ aclId: 'acl-2', siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.deleteAcl).toHaveBeenCalledWith('acl-2', 'site-1', undefined);
    });

    it('throws when the ACL does not exist in either list', async () => {
        vi.mocked(mockClient.listOsgAcls).mockResolvedValue([] as never);
        vi.mocked(mockClient.listEapAcls).mockResolvedValue([] as never);
        registerDeleteAclTool(mockServer, mockClient);

        await expect(toolHandler({ aclId: 'missing' }, { sessionId: 's1' })).rejects.toThrow('No ACL exists for missing.');
    });

    it('surfaces the first lookup error when ACL discovery fails', async () => {
        vi.mocked(mockClient.listEapAcls).mockRejectedValueOnce('controller failed');
        vi.mocked(mockClient.listOsgAcls).mockRejectedValueOnce(new Error('secondary failure'));
        registerDeleteAclTool(mockServer, mockClient);

        await expect(toolHandler({ aclId: 'missing' }, { sessionId: 's1' })).rejects.toThrow('controller failed');
    });
});
