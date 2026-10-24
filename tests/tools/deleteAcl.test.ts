import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteAclTool } from '../../src/tools/deleteAcl.js';

describe('tools/deleteAcl', () => {
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
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'delete-acl',
                target: 'acl-1',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned ACL deletion for acl-1.',
                result: { accepted: true, dryRun: true, before: { id: 'acl-1', description: 'Gateway ACL' } },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('deletes EAP ACLs through the shared delete endpoint', async () => {
        registerDeleteAclTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, aclId: 'acl-2', siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.deleteAcl).toHaveBeenCalledWith('acl-2', 'site-1', undefined);
    });

    it('tolerates unrelated ACL family lookup errors when the target ACL exists', async () => {
        vi.mocked(mockClient.listOsgAcls).mockRejectedValueOnce(new Error('General error.'));
        registerDeleteAclTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, aclId: 'acl-2', siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.deleteAcl).toHaveBeenCalledWith('acl-2', 'site-1', undefined);
    });

    it('throws when the ACL does not exist in either list', async () => {
        vi.mocked(mockClient.listOsgAcls).mockResolvedValue([] as never);
        vi.mocked(mockClient.listEapAcls).mockResolvedValue([] as never);
        registerDeleteAclTool(mockServer, mockClient);

        await expect(toolHandler({ dryRun: false, aclId: 'missing' }, { sessionId: 's1' })).rejects.toThrow('No ACL exists for missing.');
    });

    it('surfaces the first lookup error when ACL discovery fails', async () => {
        vi.mocked(mockClient.listEapAcls).mockRejectedValueOnce('controller failed');
        vi.mocked(mockClient.listOsgAcls).mockRejectedValueOnce(new Error('secondary failure'));
        registerDeleteAclTool(mockServer, mockClient);

        await expect(toolHandler({ dryRun: false, aclId: 'missing' }, { sessionId: 's1' })).rejects.toThrow('controller failed');
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerDeleteAclTool(mockServer, mockClient);
        const result = (await toolHandler({ aclId: 'acl-1' }, { sessionId: 'preview' })) as {
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
