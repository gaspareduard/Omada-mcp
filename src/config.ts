import { z } from 'zod';

import { isValidBindAddress, isValidOrigin } from './utils/config-validations.js';
import { logger } from './utils/logger.js';

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

const envSchema = z
    .object({
        // Omada Client Configuration
        baseUrl: z.string().url({ message: 'OMADA_BASE_URL must be a valid URL' }),
        clientId: z.string().min(1, 'OMADA_CLIENT_ID must not be empty').optional(),
        clientSecret: z.string().min(1, 'OMADA_CLIENT_SECRET must not be empty').optional(),
        omadacId: z.string().min(1, 'OMADA_OMADAC_ID must not be empty').optional(),
        siteId: z.string().min(1).optional(),
        strictSsl: createBooleanStringSchema(true),
        requestTimeout: numericStringSchema,

        // MCP Generic Server Configuration
        logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
        logFormat: z.enum(['plain', 'json', 'gcp-json']).optional().default('plain'),
        useHttp: createBooleanStringSchema(false),

        // MCP Server HTTP Configuration
        httpPort: numericStringSchema,
        httpTransport: z.literal('stream').optional().default('stream'),
        httpBindAddr: z.string().optional(),
        httpPath: z.string().optional(),
        httpEnableHealthcheck: createBooleanStringSchema(true),
        httpHealthcheckPath: z.string().optional(),
        httpAllowCors: createBooleanStringSchema(true),
        httpAllowedOrigins: listStringSchema,
        httpNgrokEnabled: createBooleanStringSchema(false),
        httpNgrokAuthToken: z.string().optional(),
    })
    .refine((data) => data.useHttp || !!data.clientId, { message: 'OMADA_CLIENT_ID is required when not using HTTP mode', path: ['clientId'] })
    .refine((data) => data.useHttp || !!data.clientSecret, {
        message: 'OMADA_CLIENT_SECRET is required when not using HTTP mode',
        path: ['clientSecret'],
    })
    .refine((data) => data.useHttp || !!data.omadacId, { message: 'OMADA_OMADAC_ID is required when not using HTTP mode', path: ['omadacId'] })
    .refine(
        (data) => {
            // Validate httpBindAddr if provided
            if (data.httpBindAddr && !isValidBindAddress(data.httpBindAddr)) {
                return false;
            }
            return true;
        },
        {
            message: 'MCP_HTTP_BIND_ADDR must be a valid IPv4 or IPv6 address',
            path: ['httpBindAddr'],
        }
    )
    .refine(
        (data) => {
            // Validate httpAllowedOrigins if provided
            if (data.httpAllowedOrigins) {
                for (const origin of data.httpAllowedOrigins) {
                    if (!isValidOrigin(origin)) {
                        return false;
                    }
                }
            }
            return true;
        },
        (data) => {
            const invalidOrigin = data.httpAllowedOrigins?.find((origin) => !isValidOrigin(origin));
            return {
                message: `MCP_HTTP_ALLOWED_ORIGINS contains invalid origin: ${invalidOrigin}`,
                path: ['httpAllowedOrigins'],
            };
        }
    );

/**
 * The resolved Omada connection parameters required to build an OmadaClient.
 * All fields are guaranteed to be present.
 */
export interface OmadaConnectionConfig {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    omadacId: string;
    siteId?: string;
    strictSsl: boolean;
    requestTimeout?: number;
}

export interface EnvironmentConfig {
    // Omada Client Configuration
    // baseUrl is always required (from env)
    // clientId, clientSecret, omadacId are optional in HTTP mode (can come from request headers)
    baseUrl: string;
    clientId?: string;
    clientSecret?: string;
    omadacId?: string;
    siteId?: string;
    strictSsl: boolean;
    requestTimeout?: number;

    // MCP Generic Server Configuration
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logFormat: 'plain' | 'json' | 'gcp-json';
    useHttp: boolean;

    // MCP Server HTTP Configuration
    httpPort?: number;
    httpTransport: 'stream';
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

        // MCP Server HTTP Configuration
        httpPort: env.MCP_HTTP_PORT,
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

    // Determine default httpPath
    const httpPath = parsed.data.httpPath ?? '/mcp';

    // Set default bind address and allowed origins for security
    const httpBindAddr = parsed.data.httpBindAddr ?? '127.0.0.1';
    let httpAllowedOrigins = parsed.data.httpAllowedOrigins ?? ['127.0.0.1', 'localhost'];

    // If wildcard is present, use empty array to disable SDK origin validation
    // (we'll handle it in our error handler with better logging)
    if (httpAllowedOrigins.includes('*')) {
        logger.warn('Wildcard (*) origin allowed - origin validation is disabled. This should only be used in development.');
        httpAllowedOrigins = [];
    }

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

        // MCP Server HTTP/SSE Configuration
        httpPort: parsed.data.httpPort,
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
