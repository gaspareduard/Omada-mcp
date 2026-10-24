import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerCreateGatewayAclTool } from '../../src/tools/createGatewayAcl.js';

describe('tools/createGatewayAcl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

    const payload = {
        description: 'Guests drop WAN',
        status: true,
        policy: 0,
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
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
            }),
        } as unknown as McpServer;

        mockClient = {
            createOsgAcl: vi.fn().mockResolvedValue({ id: 'acl-1' }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview', async () => {
        registerCreateGatewayAclTool(mockServer, mockClient);

        const result = await toolHandler({ payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.createOsgAcl).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'create-gateway-acl',
                target: 'default-site',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned gateway ACL creation.',
                result: { accepted: true, dryRun: true, plannedAcl: payload },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('creates the gateway ACL through the client', async () => {
        registerCreateGatewayAclTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.createOsgAcl).toHaveBeenCalledWith(payload, 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerCreateGatewayAclTool(mockServer, mockClient);
        const result = (await toolHandler({ payload }, { sessionId: 'preview' })) as {
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
