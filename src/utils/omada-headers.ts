import type { IncomingHttpHeaders } from 'node:http';
import type { EnvironmentConfig, OmadaConnectionConfig } from '../config.js';

/**
 * Extract the three Omada authentication credential fields from request headers.
 * Only x-omada-client-id, x-omada-client-secret, and x-omada-omadac-id are supported.
 * All other Omada configuration must come from environment variables.
 */
export function extractAuthFromHeaders(headers: IncomingHttpHeaders): {
    clientId?: string;
    clientSecret?: string;
    omadacId?: string;
} {
    const result: { clientId?: string; clientSecret?: string; omadacId?: string } = {};

    const clientId = headers['x-omada-client-id'];
    if (typeof clientId === 'string' && clientId.length > 0) {
        result.clientId = clientId;
    }

    const clientSecret = headers['x-omada-client-secret'];
    if (typeof clientSecret === 'string' && clientSecret.length > 0) {
        result.clientSecret = clientSecret;
    }

    const omadacId = headers['x-omada-omadac-id'];
    if (typeof omadacId === 'string' && omadacId.length > 0) {
        result.omadacId = omadacId;
    }

    return result;
}

/**
 * Build a full OmadaConnectionConfig by merging environment config with header-supplied credentials.
 * Environment variable values always win over header values.
 * Throws if any required credential field is absent from both env and headers.
 */
export function resolveOmadaConfig(
    config: EnvironmentConfig,
    headerAuth: { clientId?: string; clientSecret?: string; omadacId?: string }
): OmadaConnectionConfig {
    const clientId = config.clientId ?? headerAuth.clientId;
    const clientSecret = config.clientSecret ?? headerAuth.clientSecret;
    const omadacId = config.omadacId ?? headerAuth.omadacId;

    if (!clientId) {
        throw new Error('Missing required Omada credentials: set OMADA_CLIENT_ID env var or x-omada-client-id header');
    }
    if (!clientSecret) {
        throw new Error('Missing required Omada credentials: set OMADA_CLIENT_SECRET env var or x-omada-client-secret header');
    }
    if (!omadacId) {
        throw new Error('Missing required Omada credentials: set OMADA_OMADAC_ID env var or x-omada-omadac-id header');
    }

    return {
        baseUrl: config.baseUrl,
        clientId,
        clientSecret,
        omadacId,
        siteId: config.siteId,
        strictSsl: config.strictSsl,
        requestTimeout: config.requestTimeout,
    };
}
