import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActionOperations } from '../../src/omadaClient/actions.js';

describe('omadaClient/actions', () => {
    const mockRequest = {
        post: vi.fn(),
        ensureSuccess: vi.fn((value) => value.result),
    };
    const mockSite = {
        resolveSiteId: vi.fn((siteId?: string) => siteId ?? 'default-site'),
    };
    const buildPath = vi.fn((path: string) => `/api${path}`);

    let actions: ActionOperations;

    beforeEach(() => {
        vi.clearAllMocks();
        actions = new ActionOperations(mockRequest as never, mockSite as never, buildPath);
    });

    it('reboots a device through the documented action endpoint', async () => {
        mockRequest.post.mockResolvedValue({ errorCode: 0, result: { accepted: true } });

        await expect(actions.rebootDevice('AA:BB:CC:DD:EE:FF', 'site-1')).resolves.toEqual({ accepted: true });
        expect(mockRequest.post).toHaveBeenCalledWith('/api/sites/site-1/devices/AA%3ABB%3ACC%3ADD%3AEE%3AFF/reboot', {}, undefined);
    });

    it('blocks and unblocks a client through client action endpoints', async () => {
        mockRequest.post.mockResolvedValue({ errorCode: 0, result: { accepted: true } });

        await actions.blockClient('AA:BB:CC:DD:EE:FF', 'site-1');
        await actions.unblockClient('AA:BB:CC:DD:EE:FF', 'site-1');

        expect(mockRequest.post).toHaveBeenNthCalledWith(1, '/api/sites/site-1/clients/AA%3ABB%3ACC%3ADD%3AEE%3AFF/block', {}, undefined);
        expect(mockRequest.post).toHaveBeenNthCalledWith(2, '/api/sites/site-1/clients/AA%3ABB%3ACC%3ADD%3AEE%3AFF/unblock', {}, undefined);
    });

    it('reconnects clients and updates LED state through official action endpoints', async () => {
        mockRequest.post.mockResolvedValue({ errorCode: 0, result: { accepted: true } });

        await actions.reconnectClient('AA:BB:CC:DD:EE:FF', 'site-1');
        await actions.setDeviceLed('AA:BB:CC:DD:EE:FF', 2, 'site-1');

        expect(mockRequest.post).toHaveBeenNthCalledWith(1, '/api/sites/site-1/clients/AA%3ABB%3ACC%3ADD%3AEE%3AFF/reconnect', {}, undefined);
        expect(mockRequest.post).toHaveBeenNthCalledWith(
            2,
            '/api/sites/site-1/devices/AA%3ABB%3ACC%3ADD%3AEE%3AFF/led-setting',
            { ledSetting: 2 },
            undefined
        );
    });
});
