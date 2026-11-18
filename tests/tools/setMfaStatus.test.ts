import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerSetMfaStatusTool } from '../../src/tools/setMfaStatus.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

describe('tools/setMfaStatus', () => {
    let state: Record<string, unknown>;
    let handler: Handler;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
        state = { enable: false };
        client = {
            getMfaStatus: vi.fn(async () => state),
            setMfaStatus: vi.fn((body: Record<string, unknown>) => {
                state = body;
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerSetMfaStatusTool(server, client as unknown as OmadaClient);
    });

    it('requires an explicit boolean', () => {
        expect(() => definition.inputSchema.enable.parse('yes')).toThrow();
    });

    it('previews with a lockout warning when enabling', async () => {
        const result = await handler({ enable: true }, {});
        expect(client.setMfaStatus).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: { enable: false }, alreadyMatches: false } });
        expect(JSON.stringify(result.structuredContent)).toContain('locked out');
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ enable: true, dryRun: false }, {});
        expect(client.setMfaStatus).toHaveBeenCalledWith({ enable: true }, undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('does not write when the status already matches and warns when disabling', async () => {
        const result = await handler({ enable: false, dryRun: false }, {});
        expect(client.setMfaStatus).not.toHaveBeenCalled();
        expect(JSON.stringify(result.structuredContent)).toContain('weakens');
    });

    it('surfaces controller rejections', async () => {
        client.setMfaStatus.mockRejectedValueOnce(new OmadaApiError(-1, 'no'));
        await expect(handler({ enable: true, dryRun: false }, {})).rejects.toThrow('(errorCode -1): no');
    });
});
