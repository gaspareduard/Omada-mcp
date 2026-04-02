import { beforeEach, describe, expect, it, vi } from 'vitest';

const baseConfig = {
    useHttp: false,
    unsafeEnableHttp: false,
    capabilityProfile: 'safe-read',
    logLevel: 'info',
    logFormat: 'plain',
    baseUrl: 'https://controller.local',
    omadacId: 'omada-1',
    siteId: 'site-1',
    strictSsl: true,
    requestTimeout: 15_000,
    httpTransport: 'stream',
    toolCategories: new Map(),
    startupWarnings: [],
};

const loadEntry = async () => import('../src/index.js');

describe('src/index main entry', () => {
    let mockInitLogger: ReturnType<typeof vi.fn>;
    let loggerInfo: ReturnType<typeof vi.fn>;
    let loggerWarn: ReturnType<typeof vi.fn>;
    let loggerError: ReturnType<typeof vi.fn>;
    let startHttpServer: ReturnType<typeof vi.fn>;
    let startStdioServer: ReturnType<typeof vi.fn>;
    let OmadaClient: ReturnType<typeof vi.fn>;
    let loadConfigFromEnv: ReturnType<typeof vi.fn>;
    let stderrWrite: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.exitCode = undefined;

        mockInitLogger = vi.fn();
        loggerInfo = vi.fn();
        loggerWarn = vi.fn();
        loggerError = vi.fn();
        startHttpServer = vi.fn(async () => undefined);
        startStdioServer = vi.fn(async () => undefined);
        loadConfigFromEnv = vi.fn();
        OmadaClient = vi.fn(function OmadaClientMock(config: Record<string, unknown>) {
            return { client: 'instance', config };
        });
        stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

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
                warn: loggerWarn,
                error: loggerError,
            },
        }));
    });

    afterEach(() => {
        stderrWrite.mockRestore();
    });

    it('starts stdio server when HTTP is disabled', async () => {
        loadConfigFromEnv.mockReturnValue({ ...baseConfig, useHttp: false });

        await loadEntry();

        expect(mockInitLogger).toHaveBeenCalledWith('info', 'plain', true);
        expect(OmadaClient).toHaveBeenCalledWith(expect.objectContaining({ baseUrl: 'https://controller.local' }));
        expect(startStdioServer).toHaveBeenCalledWith(expect.objectContaining({ client: 'instance' }), new Map());
        expect(startHttpServer).not.toHaveBeenCalled();
        expect(loggerInfo).toHaveBeenCalledWith(
            'Starting Safe Omada MCP server',
            expect.objectContaining({ name: 'safe-omada-mcp', version: expect.any(String), mode: 'stdio' })
        );
        expect(loggerInfo).toHaveBeenCalledWith('Loaded Omada configuration', expect.objectContaining({ omadacId: 'omada-1' }));
    });

    it('starts HTTP server when enabled', async () => {
        loadConfigFromEnv.mockReturnValue({ ...baseConfig, useHttp: true, logFormat: 'json' });

        await loadEntry();

        expect(mockInitLogger).toHaveBeenCalledWith('info', 'json', false);
        expect(OmadaClient).not.toHaveBeenCalled();
        expect(startHttpServer).toHaveBeenCalledWith(expect.objectContaining({ useHttp: true }));
        expect(startStdioServer).not.toHaveBeenCalled();
    });

    it('writes startup failures to stderr and sets exit code', async () => {
        loadConfigFromEnv.mockReturnValue({ ...baseConfig, useHttp: false });
        const failure = new Error('boom');
        startStdioServer.mockRejectedValueOnce(failure);

        await loadEntry();

        expect(stderrWrite).toHaveBeenCalledWith(expect.stringContaining('Failed to start Omada MCP server: boom'));
        expect(process.exitCode).toBe(1);
    });

    it('emits startup warnings only after logger is initialized', async () => {
        loadConfigFromEnv.mockReturnValue({
            ...baseConfig,
            useHttp: false,
            startupWarnings: ['Unknown category: "network-sim-lte" is a future/unimplemented category'],
        });

        await loadEntry();

        expect(loggerWarn).toHaveBeenCalledWith('Unknown category: "network-sim-lte" is a future/unimplemented category');
        // initLogger must have been called before any warning was emitted
        const initOrder = mockInitLogger.mock.invocationCallOrder[0];
        const warnOrder = loggerWarn.mock.invocationCallOrder[0];
        expect(initOrder).toBeLessThan(warnOrder);
    });
});
