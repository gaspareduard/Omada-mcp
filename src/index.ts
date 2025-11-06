import './env.js';
import { loadConfigFromEnv } from './config.js';
import { OmadaClient } from './omadaClient/index.js';
import { startHttpServer } from './server/http.js';
import { startStdioServer } from './server/stdio.js';
import { initLogger, logger } from './utils/logger.js';

async function main(): Promise<void> {
    const config = loadConfigFromEnv();

    // When running in stdio mode, logs must go to stderr to avoid interfering with MCP protocol on stdout
    const useStderr = !config.useHttp;

    // Initialize logger with configured level, format, and output stream
    initLogger(config.logLevel, config.logFormat, useStderr);

    logger.info('Loaded Omada configuration', {
        baseUrl: config.baseUrl,
        omadacId: config.omadacId,
        siteId: config.siteId ?? null,
        strictSsl: config.strictSsl,
        requestTimeout: config.requestTimeout ?? null,
    });

    const client = new OmadaClient(config);

    if (config.useHttp) {
        await startHttpServer(client, config);
    } else {
        await startStdioServer(client);
    }
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to start Omada MCP server', { error: message });
    process.exitCode = 1;
});
