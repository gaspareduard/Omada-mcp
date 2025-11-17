import { beforeEach, describe, expect, it, vi } from 'vitest';

const baseConfig = {
    useHttp: false,
    logLevel: 'info',
    logFormat: 'plain',
    baseUrl: 'https://controller.local',
    omadacId: 'omada-1',
    siteId: 'site-1',
    strictSsl: true,
    requestTimeout: 15_000,
    httpTransport: 'sse',
};

const loadEntry = async () => import('../src/index.js');

describe('src/index main entry', () => {
    let mockInitLogger: ReturnType<typeof vi.fn>;
    let loggerInfo: ReturnType<typeof vi.fn>;
    let loggerError: ReturnType<typeof vi.fn>;
    let startHttpServer: ReturnType<typeof vi.fn>;
    let startStdioServer: ReturnType<typeof vi.fn>;
    let OmadaClient: ReturnType<typeof vi.fn>;
    let loadConfigFromEnv: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.exitCode = undefined;

        mockInitLogger = vi.fn();
        loggerInfo = vi.fn();
        loggerError = vi.fn();
        startHttpServer = vi.fn(async () => undefined);
        startStdioServer = vi.fn(async () => undefined);
        loadConfigFromEnv = vi.fn();
        OmadaClient = vi.fn(function OmadaClientMock(config: Record<string, unknown>) {
            return { client: 'instance', config };
        });

        vi.doMock('../src/env.js', () => ({}));
        vi.doMock('../src/config.js', () => ({
            loadConfigFromEnv,
        }));
        vi.doMock('../src/omadaClient/index.js', () => ({
            OmadaClient,
        }));
        vi.doMock('../src/server/http.js', () => ({
            startHttpServer,
        }));
        vi.doMock('../src/server/stdio.js', () => ({
            startStdioServer,
        }));
        vi.doMock('../src/utils/logger.js', () => ({
            initLogger: mockInitLogger,
            logger: {
                info: loggerInfo,
                error: loggerError,
            },
        }));
    });

    it('starts stdio server when HTTP is disabled', async () => {
        loadConfigFromEnv.mockReturnValue({ ...baseConfig, useHttp: false });

        await loadEntry();

        expect(mockInitLogger).toHaveBeenCalledWith('info', 'plain', true);
        expect(OmadaClient).toHaveBeenCalledWith(expect.objectContaining({ baseUrl: 'https://controller.local' }));
        expect(startStdioServer).toHaveBeenCalledWith(expect.objectContaining({ client: 'instance' }));
        expect(startHttpServer).not.toHaveBeenCalled();
        expect(loggerInfo).toHaveBeenCalledWith('Loaded Omada configuration', expect.objectContaining({ omadacId: 'omada-1' }));
    });

    it('starts HTTP server when enabled', async () => {
        loadConfigFromEnv.mockReturnValue({ ...baseConfig, useHttp: true, logFormat: 'json' });

        await loadEntry();

        expect(mockInitLogger).toHaveBeenCalledWith('info', 'json', false);
        expect(startHttpServer).toHaveBeenCalledWith(expect.objectContaining({ client: 'instance' }), expect.objectContaining({ useHttp: true }));
        expect(startStdioServer).not.toHaveBeenCalled();
    });

    it('logs startup failures and sets exit code', async () => {
        loadConfigFromEnv.mockReturnValue({ ...baseConfig, useHttp: false });
        const failure = new Error('boom');
        startStdioServer.mockRejectedValueOnce(failure);

        await loadEntry();

        expect(loggerError).toHaveBeenCalledWith('Failed to start Omada MCP server', { error: 'boom' });
        expect(process.exitCode).toBe(1);
    });
});
