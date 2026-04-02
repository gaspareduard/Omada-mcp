import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosRequestHeaders } from 'axios';

import type { CustomHeaders, OmadaApiResponse, PaginatedResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

import type { AuthManager } from './auth.js';

const DEFAULT_PAGE_SIZE = 200;
const MIN_REQUEST_INTERVAL_MS = 125;
const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([-1005]);

/**
 * HTTP request handler for Omada API calls with authentication and retry logic.
 */
export class RequestHandler {
    private nextAllowedRequestAt = 0;

    constructor(
        private readonly http: AxiosInstance,
        private readonly auth: AuthManager
    ) {}

    /**
     * Make a GET request to the Omada API.
     */
    public async get<T>(path: string, params?: Record<string, unknown>, customHeaders?: CustomHeaders): Promise<T> {
        return await this.request<T>({ method: 'GET', url: path, params }, true, customHeaders);
    }

    /**
     * Make a PATCH request to the Omada API.
     */
    public async patch<T>(path: string, data?: unknown, customHeaders?: CustomHeaders): Promise<T> {
        return await this.request<T>({ method: 'PATCH', url: path, data }, true, customHeaders);
    }

    /**
     * Make a POST request to the Omada API.
     */
    public async post<T>(path: string, data?: unknown, customHeaders?: CustomHeaders): Promise<T> {
        return await this.request<T>({ method: 'POST', url: path, data }, true, customHeaders);
    }

    /**
     * Make an arbitrary HTTP request to the Omada API.
     */
    public async request<T>(config: AxiosRequestConfig, retry = true, customHeaders?: CustomHeaders): Promise<T> {
        await this.waitForRateWindow();
        const accessToken = await this.auth.getAccessToken();

        const requestConfig: AxiosRequestConfig = {
            ...config,
            headers: {
                ...(config.headers ?? {}),
                ...(customHeaders ?? {}),
                Authorization: `AccessToken=${accessToken}`,
            },
        };

        const method = (requestConfig.method ?? 'GET').toUpperCase();
        const url = requestConfig.url ?? 'unknown-url';
        logger.info('Omada request', {
            method,
            url,
            params: requestConfig.params,
            siteId: requestConfig.params?.siteId ?? undefined,
        });

        logger.debug('Omada request details', {
            method,
            url,
            headers: this.sanitizeHeaders(requestConfig.headers as AxiosRequestHeaders | undefined),
            params: requestConfig.params ?? null,
            data: this.sanitizePayload(requestConfig.data),
        });

        try {
            const response = await this.http.request<T>(requestConfig);
            logger.info('Omada response', {
                method,
                url,
                status: response.status,
            });

            logger.debug('Omada response payload', {
                method,
                url,
                status: response.status,
                headers: this.sanitizeHeaders(response.headers as AxiosRequestHeaders | undefined),
                data: this.sanitizePayload(response.data),
            });

            // Check if the response data indicates an authentication error
            const errorCode = (response.data as { errorCode?: number } | undefined)?.errorCode;
            const errorMsg = (response.data as { msg?: string } | undefined)?.msg;

            if (retry && (this.isAuthErrorCode(errorCode) || this.isTokenExpiredMessage(errorMsg))) {
                logger.warn('Omada authentication error in response, retrying with fresh token', {
                    method,
                    url,
                    errorCode,
                    message: errorMsg,
                });
                this.auth.clearToken();
                return this.request<T>(config, false, customHeaders);
            }

            return response.data;
        } catch (error) {
            logger.error('Omada request failed', {
                method,
                url,
                message: error instanceof Error ? error.message : String(error),
            });

            if (axios.isAxiosError(error) && error.response) {
                logger.debug('Omada error response payload', {
                    method,
                    url,
                    status: error.response.status,
                    headers: this.sanitizeHeaders(error.response.headers as AxiosRequestHeaders | undefined),
                    data: this.sanitizePayload(error.response.data),
                });
            }

            if (!retry || !axios.isAxiosError(error)) {
                throw error;
            }

            const status = error.response?.status;
            const errorCode = (error.response?.data as { errorCode?: number } | undefined)?.errorCode;

            if (status === 401 || status === 403 || this.isAuthErrorCode(errorCode)) {
                this.auth.clearToken();
                return this.request<T>(config, false, customHeaders);
            }

            if (
                retry &&
                ((status !== undefined && RETRYABLE_STATUS_CODES.has(status)) || (errorCode !== undefined && RETRYABLE_ERROR_CODES.has(errorCode)))
            ) {
                await this.sleep(this.getRetryDelayMs(status));
                return this.request<T>(config, false, customHeaders);
            }

            throw error;
        }
    }

    /**
     * Fetch all pages of a paginated API endpoint.
     */
    public async fetchPaginated<T>(path: string, params: Record<string, unknown> = {}, customHeaders?: CustomHeaders): Promise<T[]> {
        const records: T[] = [];
        let page = 1;
        let totalRows: number | undefined;

        // Fetch sequential pages because OpenAPI requires explicit pagination parameters.
        do {
            const response = await this.get<OmadaApiResponse<PaginatedResult<T>>>(
                path,
                {
                    ...params,
                    page,
                    pageSize: DEFAULT_PAGE_SIZE,
                },
                customHeaders
            );

            const result = this.ensureSuccess(response);
            const pageData = result.data ?? [];
            totalRows = result.totalRows ?? totalRows;

            records.push(...pageData);
            page += 1;

            if (pageData.length === 0) {
                break;
            }
        } while (!totalRows || records.length < totalRows);

        return records;
    }

    /**
     * Ensure an Omada API response indicates success.
     * @throws {Error} If the response contains an error code
     */
    public ensureSuccess<T>(response: OmadaApiResponse<T>): T {
        if (response.errorCode !== 0) {
            logger.error('Omada API error', {
                errorCode: response.errorCode,
                message: response.msg,
            });
            throw new Error(response.msg ?? 'Omada API request failed');
        }

        return (response.result ?? ({} as T)) as T;
    }

    /**
     * Check if an error code indicates an authentication error.
     */
    private isAuthErrorCode(errorCode?: number): boolean {
        if (errorCode === undefined) {
            return false;
        }

        return [-44106, -44111, -44112, -44113, -44114, -44116].includes(errorCode);
    }

    /**
     * Check if an error message indicates token expiration.
     */
    private isTokenExpiredMessage(message?: string): boolean {
        if (!message) {
            return false;
        }

        const lowerMsg = message.toLowerCase();
        return (
            lowerMsg.includes('access token has expired') ||
            lowerMsg.includes('token has expired') ||
            lowerMsg.includes('token expired') ||
            lowerMsg.includes('re-initiate the refreshtoken')
        );
    }

    private async waitForRateWindow(): Promise<void> {
        const now = Date.now();
        if (now < this.nextAllowedRequestAt) {
            await this.sleep(this.nextAllowedRequestAt - now);
        }
        this.nextAllowedRequestAt = Date.now() + MIN_REQUEST_INTERVAL_MS;
    }

    private getRetryDelayMs(status?: number): number {
        if (status === 429) {
            return 1000;
        }
        return 500;
    }

    private async sleep(ms: number): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Sanitize HTTP headers for logging, masking sensitive values.
     */
    private sanitizeHeaders(headers: AxiosRequestHeaders | undefined): Record<string, unknown> | undefined {
        if (!headers) {
            return undefined;
        }

        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(headers)) {
            sanitized[key] = this.isSensitiveKey(key) ? this.maskValue(value) : value;
        }

        return sanitized;
    }

    /**
     * Sanitize a payload for logging, masking sensitive values.
     */
    private sanitizePayload(payload: unknown): unknown {
        if (!payload || typeof payload !== 'object') {
            return payload;
        }

        if (Array.isArray(payload)) {
            return payload.map((item) => this.sanitizePayload(item));
        }

        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(payload)) {
            sanitized[key] = this.isSensitiveKey(key) ? this.maskValue(value) : this.sanitizePayload(value);
        }

        return sanitized;
    }

    /**
     * Check if a key name indicates sensitive data.
     */
    private isSensitiveKey(key: string): boolean {
        const normalized = key.toLowerCase();
        return (
            normalized.includes('authorization') ||
            normalized.includes('token') ||
            normalized.includes('secret') ||
            normalized.includes('password') ||
            normalized.includes('client_id')
        );
    }

    /**
     * Mask a sensitive value for logging.
     */
    private maskValue(value: unknown): unknown {
        if (typeof value === 'string') {
            if (value.length <= 8) {
                return '********';
            }
            return `${value.slice(0, 4)}…${value.slice(-4)}`;
        }

        if (Array.isArray(value)) {
            return value.map(() => '********');
        }

        if (typeof value === 'object' && value !== null) {
            return '[masked-object]';
        }

        return '********';
    }
}
