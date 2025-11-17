import pino from 'pino';

type LogFields = Record<string, unknown>;

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

type LogFormat = 'plain' | 'json' | 'gcp-json';

const levelToSeverity: Record<string, string> = {
    trace: 'DEBUG',
    debug: 'DEBUG',
    info: 'INFO',
    warn: 'WARNING',
    error: 'ERROR',
    fatal: 'CRITICAL',
};

let instance: pino.Logger;

function createLogger(level: LogLevel = 'info', format: LogFormat = 'plain', useStderr = false): pino.Logger {
    const baseConfig: pino.LoggerOptions = {
        level,
        base: undefined,
        messageKey: 'message',
        timestamp: pino.stdTimeFunctions.isoTime,
    };

    // Configure formatters based on format
    if (format === 'gcp-json') {
        baseConfig.formatters = {
            level(label) {
                return { severity: levelToSeverity[label] ?? label.toUpperCase() };
            },
        };
    } else if (format === 'plain') {
        // For plain format, we still output JSON but could be enhanced with pino-pretty
        // For now, using JSON output with a note that pino-pretty can be added as optional dependency
        baseConfig.formatters = {
            level(label) {
                return { level: label.toUpperCase() };
            },
        };
    }
    // For 'json' format, use default pino JSON output (no special formatters)

    // When running in stdio mode, always log to stderr to avoid interfering with MCP protocol on stdout
    // Pass stderr as the destination stream (second parameter to pino constructor)
    return useStderr ? pino(baseConfig, process.stderr) : pino(baseConfig);
}

// Initialize with default, will be reconfigured by calling initLogger
// Read log level from environment for tests
const defaultLevel = (process.env.MCP_SERVER_LOG_LEVEL as LogLevel | undefined) ?? 'info';
instance = createLogger(defaultLevel);

/**
 * Initialize the logger with a specific log level and format.
 * This should be called once during application startup.
 * @param level - The minimum log level to output
 * @param format - The output format (plain, json, or gcp-json)
 * @param useStderr - If true, logs to stderr instead of stdout (required for stdio transport)
 */
export function initLogger(level: LogLevel, format: LogFormat = 'plain', useStderr = false): void {
    instance = createLogger(level, format, useStderr);
}

function normalizeMeta(meta?: LogFields): LogFields | undefined {
    if (!meta) {
        return undefined;
    }

    const normalized: LogFields = {};
    for (const [key, value] of Object.entries(meta)) {
        if (value instanceof Error) {
            normalized[key] = { message: value.message, stack: value.stack };
            continue;
        }

        normalized[key] = value;
    }

    return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function write(level: LogLevel, message: string, meta?: LogFields): void {
    const fields = normalizeMeta(meta);
    if (fields) {
        instance[level](fields, message);
    } else {
        instance[level](message);
    }
}

export const logger = {
    debug(message: string, meta?: LogFields) {
        write('debug', message, meta);
    },
    info(message: string, meta?: LogFields) {
        write('info', message, meta);
    },
    warn(message: string, meta?: LogFields) {
        write('warn', message, meta);
    },
    error(message: string, meta?: LogFields) {
        write('error', message, meta);
    },
};
