import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosRequestHeaders } from 'axios';

import type { CustomHeaders, OmadaApiResponse, PaginatedResult } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { isSensitiveKey, maskValue } from '../utils/redact.js';

import type { AuthManager } from './auth.js';

const DEFAULT_PAGE_SIZE = 200;
const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);
// The Open API guide defines -1005 as "Operation forbidden", not rate limiting.
const RETRYABLE_ERROR_CODES = new Set([-7132]);
const RETRYABLE_NETWORK_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EAI_AGAIN']);

export interface RequestHandlerOptions {
    minRequestIntervalMs?: number;
    maxReadRetries?: number;
    maxRetryDelayMs?: number;
    maxPages?: number;
    maxRecords?: number;
}

/**
 * HTTP request handler for Omada API calls with authentication and retry logic.
 */
export class RequestHandler {
    private nextAllowedRequestAt = 0;
    private requestSlot: Promise<void> = Promise.resolve();
    private readonly options: Required<RequestHandlerOptions>;

    constructor(
        private readonly http: AxiosInstance,
        private readonly auth: AuthManager,
        options: RequestHandlerOptions = {}
    ) {
        this.options = {
            minRequestIntervalMs: options.minRequestIntervalMs ?? 125,
            maxReadRetries: options.maxReadRetries ?? 2,
            maxRetryDelayMs: options.maxRetryDelayMs ?? 30_000,
            maxPages: options.maxPages ?? 1000,
            maxRecords: options.maxRecords ?? 100_000,
        };
        for (const [key, value] of Object.entries(this.options)) {
            const minimum = key === 'maxPages' || key === 'maxRecords' ? 1 : 0;
            if (!Number.isSafeInteger(value) || value < minimum) {
                throw new Error(`Invalid request option ${key}: expected an integer >= ${minimum}`);
            }
        }
    }

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
     * Make a PUT request to the Omada API.
     */
    public async put<T>(path: string, data?: unknown, customHeaders?: CustomHeaders): Promise<T> {
        return await this.request<T>({ method: 'PUT', url: path, data }, true, customHeaders);
    }

    /**
     * Make a POST request to the Omada API.
     */
    public async post<T>(path: string, data?: unknown, customHeaders?: CustomHeaders): Promise<T> {
        return await this.request<T>({ method: 'POST', url: path, data }, true, customHeaders);
    }

    /**
     * Make a DELETE request to the Omada API.
     */
    public async delete<T>(path: string, customHeaders?: CustomHeaders): Promise<T> {
        return await this.request<T>({ method: 'DELETE', url: path }, true, customHeaders);
    }

    /**
     * Make an arbitrary HTTP request to the Omada API.
     */
    public async request<T>(config: AxiosRequestConfig, retry = true, customHeaders?: CustomHeaders): Promise<T> {
        let authRetried = false;
        let readRetries = 0;
        const method = (config.method ?? 'GET').toUpperCase();
        const safeRead = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

        for (;;) {
            const accessToken = await this.auth.getAccessToken();
            // Acquire a dispatch slot after authentication; a slow cold login must not
            // cause previously reserved slots to collapse into a burst.
            await this.waitForRateWindow();

            const requestConfig: AxiosRequestConfig = {
                ...config,
                headers: {
                    ...(config.headers ?? {}),
                    ...(customHeaders ?? {}),
                    Authorization: `AccessToken=${accessToken}`,
                },
            };

            const url = requestConfig.url ?? 'unknown-url';
            logger.info('Omada request', {
                method,
                url,
                params: this.sanitizePayload(requestConfig.params),
                siteId: requestConfig.params?.siteId ?? undefined,
            });

            logger.debug('Omada request details', {
                method,
                url,
                headers: this.sanitizeHeaders(requestConfig.headers as AxiosRequestHeaders | undefined),
                params: this.sanitizePayload(requestConfig.params ?? null),
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
                if (retry && !authRetried && this.isAuthFailure(response.data)) {
                    logger.warn('Omada authentication error in response, retrying with fresh token', {
                        method,
                        url,
                    });
                    this.auth.clearToken(accessToken);
                    authRetried = true;
                    continue;
                }

                if (retry && safeRead && readRetries < this.options.maxReadRetries && RETRYABLE_ERROR_CODES.has(this.errorCode(response.data) ?? 0)) {
                    const delay = this.getRetryDelayMs(readRetries, response.status, response.headers?.['retry-after']);
                    if (delay !== undefined) {
                        readRetries += 1;
                        await this.sleep(delay);
                        continue;
                    }
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
                if (!authRetried && this.isAuthFailure(error.response?.data, status)) {
                    this.auth.clearToken(accessToken);
                    authRetried = true;
                    continue;
                }

                if (
                    safeRead &&
                    readRetries < this.options.maxReadRetries &&
                    ((status !== undefined && RETRYABLE_STATUS_CODES.has(status)) ||
                        RETRYABLE_ERROR_CODES.has(this.errorCode(error.response?.data) ?? 0) ||
                        (!error.response && RETRYABLE_NETWORK_CODES.has(error.code ?? '')))
                ) {
                    const delay = this.getRetryDelayMs(readRetries, status, error.response?.headers?.['retry-after']);
                    if (delay !== undefined) {
                        readRetries += 1;
                        await this.sleep(delay);
                        continue;
                    }
                }

                throw error;
            }
        }
    }

    /**
     * Fetch all pages of a paginated API endpoint.
     */
    public async fetchPaginated<T>(path: string, params: Record<string, unknown> = {}, customHeaders?: CustomHeaders): Promise<T[]> {
        const records: T[] = [];
        let totalRows: number | undefined;
        const seenPages = new Set<string>();

        // Fetch sequential pages because OpenAPI requires explicit pagination parameters.
        for (let page = 1; page <= this.options.maxPages; page += 1) {
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
            if (!result || typeof result !== 'object' || Array.isArray(result)) {
                throw new Error(`Malformed pagination result on page ${page}`);
            }
            if (result.totalRows !== undefined) {
                if (!Number.isSafeInteger(result.totalRows) || result.totalRows < 0) {
                    throw new Error(`Invalid pagination totalRows on page ${page}`);
                }
                if (totalRows !== undefined && totalRows !== result.totalRows) {
                    throw new Error(`Pagination totalRows changed on page ${page}; retry the read for a consistent result`);
                }
                totalRows = result.totalRows;
                if (totalRows > this.options.maxRecords) {
                    throw new Error(`Pagination record limit exceeded (${this.options.maxRecords})`);
                }
            }
            if (result.currentPage !== undefined && result.currentPage !== page) {
                throw new Error(`Unexpected pagination currentPage on page ${page}`);
            }
            if (result.currentSize !== undefined && (!Number.isSafeInteger(result.currentSize) || result.currentSize < 0)) {
                throw new Error(`Invalid pagination currentSize on page ${page}`);
            }
            // Missing data is accepted only when the controller explicitly reports
            // an empty collection. An absent result must not hide a partial read.
            if (result.data === undefined && totalRows === 0 && records.length === 0) {
                return [];
            }
            if (!Array.isArray(result.data)) {
                throw new Error(`Missing or malformed pagination data on page ${page}`);
            }
            const pageData = result.data;
            if (pageData.length > DEFAULT_PAGE_SIZE || records.length + pageData.length > this.options.maxRecords) {
                throw new Error(`Pagination record limit exceeded (${this.options.maxRecords}) or oversized page ${page}`);
            }
            if (pageData.length === 0) {
                if (totalRows !== undefined && records.length < totalRows) {
                    throw new Error(`Incomplete pagination: received ${records.length} of ${totalRows} records`);
                }
                return records;
            }
            // Include all JSON fields, sorting object keys and page entries so a
            // controller returning the same page in another order is still caught.
            const fingerprint = JSON.stringify(pageData.map((record) => this.paginationFingerprint(record)).sort());
            if (seenPages.has(fingerprint)) {
                throw new Error(`Repeated pagination data on page ${page}`);
            }
            seenPages.add(fingerprint);
            records.push(...pageData);
            if (totalRows !== undefined) {
                if (records.length > totalRows) {
                    throw new Error(`Pagination returned more records than totalRows (${totalRows})`);
                }
                if (records.length === totalRows) {
                    return records;
                }
            }
        }

        throw new Error(`Pagination page limit exceeded (${this.options.maxPages})`);
    }

    private paginationFingerprint(value: unknown): string {
        return JSON.stringify(value, (_key, item: unknown) => {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
                return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)));
            }
            return item;
        });
    }

    /**
     * Ensure an Omada API response indicates success.
     * @throws {Error} If the response contains an error code
     */
    public ensureSuccess<T>(response: OmadaApiResponse<T>): T {
        if (!response || typeof response !== 'object' || typeof response.errorCode !== 'number') {
            throw new Error('Malformed Omada API response');
        }
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
    private errorCode(data: unknown): number | undefined {
        return data && typeof data === 'object' && 'errorCode' in data && typeof data.errorCode === 'number' ? data.errorCode : undefined;
    }

    private isAuthFailure(data: unknown, status?: number): boolean {
        const code = this.errorCode(data);
        // Invalid credentials/grants/permissions cannot be repaired by refreshing.
        if (code !== undefined && [-1005, -1505, -44106, -44111, -44116, -44118].includes(code)) {
            return false;
        }
        if (status === 401 || (code !== undefined && [-44112, -44113, -44114].includes(code))) {
            return true;
        }
        const message = data && typeof data === 'object' && 'msg' in data ? data.msg : undefined;
        return code !== 0 && this.isTokenExpiredMessage(message);
    }

    /**
     * Check if an error message indicates token expiration.
     */
    private isTokenExpiredMessage(message: unknown): boolean {
        if (typeof message !== 'string') {
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

    private waitForRateWindow(): Promise<void> {
        const slot = this.requestSlot.then(async () => {
            const delay = this.nextAllowedRequestAt - Date.now();
            if (delay > 0) {
                await this.sleep(delay);
            }
            this.nextAllowedRequestAt = Date.now() + this.options.minRequestIntervalMs;
        });
        this.requestSlot = slot;
        return slot;
    }

    private getRetryDelayMs(attempt: number, status: number | undefined, retryAfter: unknown): number | undefined {
        const base = status === 429 ? 1000 : 500;
        let delay = Math.min(base * 2 ** attempt * (1 + Math.random() * 0.25), this.options.maxRetryDelayMs);
        if (typeof retryAfter === 'string' || typeof retryAfter === 'number') {
            const value = String(retryAfter).trim();
            const seconds = /^\d+(\.\d+)?$/.test(value) ? Number(value) : undefined;
            const date = seconds === undefined && /[a-z]/i.test(value) ? Date.parse(value) : Number.NaN;
            const requestedDelay = seconds === undefined ? date - Date.now() : seconds * 1000;
            if (requestedDelay > this.options.maxRetryDelayMs) return undefined;
            if (Number.isFinite(requestedDelay)) {
                // Do not retry earlier than Retry-After just to satisfy our bound.
                delay = Math.max(delay, requestedDelay);
            }
        }
        return delay;
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
            sanitized[key] = isSensitiveKey(key) ? maskValue(value) : value;
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
            sanitized[key] = isSensitiveKey(key) ? maskValue(value) : this.sanitizePayload(value);
        }

        return sanitized;
    }
}
