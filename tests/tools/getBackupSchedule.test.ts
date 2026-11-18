import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetBackupScheduleTool } from '../../src/tools/getBackupSchedule.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

describe('tools/getBackupSchedule', () => {
    it('registers and returns the controller read', async () => {
        let handler: Handler = async () => ({ content: [] });
        const server = { registerTool: vi.fn((_name, _def, fn) => (handler = fn)) } as unknown as McpServer;
        const client = { getBackupSchedule: vi.fn().mockResolvedValue([{ id: 'r1' }]) };
        registerGetBackupScheduleTool(server, client as unknown as OmadaClient);

        const result = await handler({ customHeaders: { h: '1' } }, {});

        expect(server.registerTool).toHaveBeenCalledWith(
            'getBackupSchedule',
            expect.objectContaining({ description: expect.any(String) }),
            expect.any(Function)
        );
        expect(client.getBackupSchedule).toHaveBeenCalledWith({ h: '1' });
        expect(JSON.parse(result.content[0].text)).toEqual([{ id: 'r1' }]);
    });

    it('propagates read failures', async () => {
        let handler: Handler = async () => ({ content: [] });
        const server = { registerTool: vi.fn((_name, _def, fn) => (handler = fn)) } as unknown as McpServer;
        registerGetBackupScheduleTool(server, { getBackupSchedule: vi.fn().mockRejectedValue(new Error('boom')) } as unknown as OmadaClient);
        await expect(handler({}, {})).rejects.toThrow('boom');
    });
});
