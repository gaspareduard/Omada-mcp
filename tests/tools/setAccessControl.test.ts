import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetAccessControlTool } from '../../src/tools/setAccessControl.js';

describe('tools/setAccessControl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

    const payload = {
        preAuthAccessEnable: true,
        preAuthAccessPolicies: [{ type: 2, url: 'example.com' }],
        freeAuthClientEnable: false,
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
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
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
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
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('updates access control through the client', async () => {
        registerSetAccessControlTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.setAccessControl).toHaveBeenCalledWith(payload, 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerSetAccessControlTool(mockServer, mockClient);
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
