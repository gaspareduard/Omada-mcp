import { z } from 'zod';

const createBooleanStringSchema = (
    defaultValue: boolean
): z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<'true'>, z.ZodLiteral<'false'>]>>, boolean, 'true' | 'false' | undefined> =>
    z
        .union([z.literal('true'), z.literal('false')])
        .optional()
        .transform((value: 'true' | 'false' | undefined) => {
            if (value === undefined) return defaultValue;
            return value === 'true';
        });

const numericStringSchema = z
    .string()
    .optional()
    .transform((value: string | undefined) => (value ? Number.parseInt(value, 10) : undefined))
    .pipe(z.number().positive().optional());

const listStringSchema = z
    .string()
    .optional()
    .transform((value: string | undefined) =>
        value
            ? value
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean)
            : undefined
    );

// Validates IPv4 or IPv6 addresses
function isValidIpAddress(value: string): boolean {
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 regex (simplified, supports most common formats)
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::)$/;
    return ipv4Regex.test(value) || ipv6Regex.test(value);
}

// Validates hostname, IPv4, or IPv6
function isValidOrigin(value: string): boolean {
    // Check if it's an IP address
    if (isValidIpAddress(value)) {
        return true;
    }

    // Check if it's a valid hostname (including localhost)
    const hostnameRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    return hostnameRegex.test(value) || value === 'localhost';
}

const envSchema = z
    .object({
        // Omada Client Configuration
        baseUrl: z.string().url({ message: 'OMADA_BASE_URL must be a valid URL' }),
        clientId: z.string().min(1, 'OMADA_CLIENT_ID is required'),
        clientSecret: z.string().min(1, 'OMADA_CLIENT_SECRET is required'),
        omadacId: z.string().min(1, 'OMADA_OMADAC_ID is required'),
        siteId: z.string().min(1).optional(),
        strictSsl: createBooleanStringSchema(true),
        requestTimeout: numericStringSchema,

        // MCP Generic Server Configuration
        logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
        logFormat: z.enum(['plain', 'json', 'gcp-json']).optional().default('plain'),
        useHttp: createBooleanStringSchema(false),
        stateful: createBooleanStringSchema(false),

        // MCP Server HTTP/SSE Configuration
        httpPort: numericStringSchema,
        httpHost: z.string().optional(),
        httpTransport: z.enum(['stream', 'sse']).optional().default('stream'),
        httpBindAddr: z.string().optional(),
        httpPath: z.string().optional(),
        httpEnableHealthcheck: createBooleanStringSchema(true),
        httpHealthcheckPath: z.string().optional(),
        httpAllowCors: createBooleanStringSchema(true),
        httpAllowedOrigins: listStringSchema,
        httpNgrokEnabled: createBooleanStringSchema(false),
        httpNgrokAuthToken: z.string().optional(),
    })
    .refine(
        (data) => {
            // Validate httpBindAddr if provided
            if (data.httpBindAddr && !isValidIpAddress(data.httpBindAddr)) {
                throw new Error(`MCP_HTTP_BIND_ADDR must be a valid IPv4 or IPv6 address, got: ${data.httpBindAddr}`);
            }
            return true;
        },
        { message: 'Invalid HTTP bind address' }
    )
    .refine(
        (data) => {
            // Validate httpAllowedOrigins if provided
            if (data.httpAllowedOrigins) {
                for (const origin of data.httpAllowedOrigins) {
                    if (!isValidOrigin(origin)) {
                        throw new Error(`MCP_HTTP_ALLOWED_ORIGINS contains invalid origin: ${origin}`);
                    }
                }
            }
            return true;
        },
        { message: 'Invalid allowed origins' }
    );

export interface EnvironmentConfig {
    // Omada Client Configuration
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    omadacId: string;
    siteId?: string;
    strictSsl: boolean;
    requestTimeout?: number;

    // MCP Generic Server Configuration
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logFormat: 'plain' | 'json' | 'gcp-json';
    useHttp: boolean;
    stateful: boolean;

    // MCP Server HTTP/SSE Configuration
    httpPort?: number;
    httpHost?: string;
    httpTransport: 'stream' | 'sse';
    httpBindAddr?: string;
    httpPath?: string;
    httpEnableHealthcheck: boolean;
    httpHealthcheckPath?: string;
    httpAllowCors: boolean;
    httpAllowedOrigins?: string[];
    httpNgrokEnabled: boolean;
    httpNgrokAuthToken?: string;
}

export function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
    const parsed = envSchema.safeParse({
        // Omada Client Configuration
        baseUrl: env.OMADA_BASE_URL,
        clientId: env.OMADA_CLIENT_ID,
        clientSecret: env.OMADA_CLIENT_SECRET,
        omadacId: env.OMADA_OMADAC_ID,
        siteId: env.OMADA_SITE_ID,
        strictSsl: env.OMADA_STRICT_SSL,
        requestTimeout: env.OMADA_TIMEOUT,

        // MCP Generic Server Configuration
        logLevel: env.MCP_SERVER_LOG_LEVEL,
        logFormat: env.MCP_SERVER_LOG_FORMAT,
        useHttp: env.MCP_SERVER_USE_HTTP,
        stateful: env.MCP_SERVER_STATEFUL,

        // MCP Server HTTP/SSE Configuration
        httpPort: env.MCP_HTTP_PORT,
        httpHost: env.MCP_HTTP_HOST,
        httpTransport: env.MCP_HTTP_TRANSPORT,
        httpBindAddr: env.MCP_HTTP_BIND_ADDR,
        httpPath: env.MCP_HTTP_PATH,
        httpEnableHealthcheck: env.MCP_HTTP_ENABLE_HEALTHCHECK,
        httpHealthcheckPath: env.MCP_HTTP_HEALTHCHECK_PATH,
        httpAllowCors: env.MCP_HTTP_ALLOW_CORS,
        httpAllowedOrigins: env.MCP_HTTP_ALLOWED_ORIGINS,
        httpNgrokEnabled: env.MCP_HTTP_NGROK_ENABLED,
        httpNgrokAuthToken: env.MCP_HTTP_NGROK_AUTH_TOKEN,
    });

    if (!parsed.success) {
        const messages = parsed.error.issues.map((issue: z.ZodIssue) => issue.message);
        throw new Error(`Invalid environment configuration:\n${messages.join('\n')}`);
    }

    // Determine default httpPath based on transport if not explicitly set
    const defaultPath = parsed.data.httpTransport === 'sse' ? '/sse' : '/mcp';
    const httpPath = parsed.data.httpPath ?? defaultPath;

    // Set default bind address and allowed origins for security
    const httpBindAddr = parsed.data.httpBindAddr ?? '127.0.0.1';
    const httpAllowedOrigins = parsed.data.httpAllowedOrigins ?? ['127.0.0.1', 'localhost'];

    return {
        // Omada Client Configuration
        baseUrl: parsed.data.baseUrl.replace(/\/$/, ''),
        clientId: parsed.data.clientId,
        clientSecret: parsed.data.clientSecret,
        omadacId: parsed.data.omadacId,
        siteId: parsed.data.siteId,
        strictSsl: parsed.data.strictSsl,
        requestTimeout: parsed.data.requestTimeout,

        // MCP Generic Server Configuration
        logLevel: parsed.data.logLevel,
        logFormat: parsed.data.logFormat,
        useHttp: parsed.data.useHttp,
        stateful: parsed.data.stateful,

        // MCP Server HTTP/SSE Configuration
        httpPort: parsed.data.httpPort,
        httpHost: parsed.data.httpHost,
        httpTransport: parsed.data.httpTransport,
        httpBindAddr,
        httpPath,
        httpEnableHealthcheck: parsed.data.httpEnableHealthcheck,
        httpHealthcheckPath: parsed.data.httpHealthcheckPath,
        httpAllowCors: parsed.data.httpAllowCors,
        httpAllowedOrigins,
        httpNgrokEnabled: parsed.data.httpNgrokEnabled,
        httpNgrokAuthToken: parsed.data.httpNgrokAuthToken,
    };
}
