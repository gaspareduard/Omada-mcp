import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDisableClientRateLimitTool } from '../../src/tools/disableClientRateLimit.js';
import { registerGetRateLimitProfilesTool } from '../../src/tools/getRateLimitProfiles.js';
import { registerSetClientRateLimitTool } from '../../src/tools/setClientRateLimit.js';
import { registerSetClientRateLimitProfileTool } from '../../src/tools/setClientRateLimitProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - rate limit operations', () => {
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
            getRateLimitProfiles: vi.fn(),
            setClientRateLimit: vi.fn(),
            setClientRateLimitProfile: vi.fn(),
            disableClientRateLimit: vi.fn(),
        } as unknown as OmadaClient;

        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => undefined);
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getRateLimitProfiles', () => {
        it('should execute successfully and return profiles', async () => {
            const mockProfiles = [{ id: 'profile-1', name: 'Low Speed', downLimitEnable: true, downLimit: 1024, upLimitEnable: true, upLimit: 512 }];
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfiles);

            registerGetRateLimitProfilesTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'site-1' }, {});

            expect(result).toBeDefined();
            expect(mockClient.getRateLimitProfiles).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should work without siteId', async () => {
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            registerGetRateLimitProfilesTool(mockServer, mockClient);
            await toolHandler({}, {});

            expect(mockClient.getRateLimitProfiles).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should pass customHeaders to client', async () => {
            (mockClient.getRateLimitProfiles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            const customHeaders = { 'X-Custom': 'value' };

            registerGetRateLimitProfilesTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1', customHeaders }, {});

            expect(mockClient.getRateLimitProfiles).toHaveBeenCalledWith('site-1', customHeaders);
        });
    });

    describe('setClientRateLimit', () => {
        it('should set rate limit for a client', async () => {
            const mockSetting = { enable: true, downLimit: 2048, upLimit: 1024 };
            (mockClient.setClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockSetting);

            registerSetClientRateLimitTool(mockServer, mockClient);
            const result = await toolHandler({ clientMac: '00:11:22:33:44:55', downLimit: 2048, upLimit: 1024, siteId: 'site-1' }, {});

            expect(result).toBeDefined();
            expect(mockClient.setClientRateLimit).toHaveBeenCalledWith('00:11:22:33:44:55', 2048, 1024, 'site-1', undefined);
        });

        it('should work without siteId', async () => {
            (mockClient.setClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({ enable: true });

            registerSetClientRateLimitTool(mockServer, mockClient);
            await toolHandler({ clientMac: '00:11:22:33:44:55', downLimit: 1024, upLimit: 512 }, {});

            expect(mockClient.setClientRateLimit).toHaveBeenCalledWith('00:11:22:33:44:55', 1024, 512, undefined, undefined);
        });

        it('should pass customHeaders to client', async () => {
            (mockClient.setClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({ enable: true });
            const customHeaders = { 'X-Custom': 'value' };

            registerSetClientRateLimitTool(mockServer, mockClient);
            await toolHandler({ clientMac: '00:11:22:33:44:55', downLimit: 1024, upLimit: 512, customHeaders }, {});

            expect(mockClient.setClientRateLimit).toHaveBeenCalledWith('00:11:22:33:44:55', 1024, 512, undefined, customHeaders);
        });
    });

    describe('setClientRateLimitProfile', () => {
        it('should apply a rate limit profile to a client', async () => {
            const mockSetting = { enable: true, rateLimitId: 'profile-1' };
            (mockClient.setClientRateLimitProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockSetting);

            registerSetClientRateLimitProfileTool(mockServer, mockClient);
            const result = await toolHandler({ clientMac: '00:11:22:33:44:55', profileId: 'profile-1', siteId: 'site-1' }, {});

            expect(result).toBeDefined();
            expect(mockClient.setClientRateLimitProfile).toHaveBeenCalledWith('00:11:22:33:44:55', 'profile-1', 'site-1', undefined);
        });

        it('should work without siteId', async () => {
            (mockClient.setClientRateLimitProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ enable: true });

            registerSetClientRateLimitProfileTool(mockServer, mockClient);
            await toolHandler({ clientMac: '00:11:22:33:44:55', profileId: 'profile-2' }, {});

            expect(mockClient.setClientRateLimitProfile).toHaveBeenCalledWith('00:11:22:33:44:55', 'profile-2', undefined, undefined);
        });

        it('should pass customHeaders to client', async () => {
            (mockClient.setClientRateLimitProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ enable: true });
            const customHeaders = { 'X-Custom': 'value' };

            registerSetClientRateLimitProfileTool(mockServer, mockClient);
            await toolHandler({ clientMac: '00:11:22:33:44:55', profileId: 'profile-1', customHeaders }, {});

            expect(mockClient.setClientRateLimitProfile).toHaveBeenCalledWith('00:11:22:33:44:55', 'profile-1', undefined, customHeaders);
        });
    });

    describe('disableClientRateLimit', () => {
        it('should disable rate limit for a client', async () => {
            const mockSetting = { enable: false };
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockSetting);

            registerDisableClientRateLimitTool(mockServer, mockClient);
            const result = await toolHandler({ clientMac: '00:11:22:33:44:55', siteId: 'site-1' }, {});

            expect(result).toBeDefined();
            expect(mockClient.disableClientRateLimit).toHaveBeenCalledWith('00:11:22:33:44:55', 'site-1', undefined);
        });

        it('should work without siteId', async () => {
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({ enable: false });

            registerDisableClientRateLimitTool(mockServer, mockClient);
            await toolHandler({ clientMac: '00:11:22:33:44:55' }, {});

            expect(mockClient.disableClientRateLimit).toHaveBeenCalledWith('00:11:22:33:44:55', undefined, undefined);
        });

        it('should pass customHeaders to client', async () => {
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({ enable: false });
            const customHeaders = { 'X-Custom': 'value' };

            registerDisableClientRateLimitTool(mockServer, mockClient);
            await toolHandler({ clientMac: '00:11:22:33:44:55', customHeaders }, {});

            expect(mockClient.disableClientRateLimit).toHaveBeenCalledWith('00:11:22:33:44:55', undefined, customHeaders);
        });
    });
});
