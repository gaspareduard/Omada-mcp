import type { AxiosInstance } from 'axios';

import type { OmadaApiResponse, TokenResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

const TOKEN_EXPIRY_BUFFER_SECONDS = 30;

/**
 * Authentication state management for the Omada client.
 */
export class AuthManager {
    private accessToken?: string;

    private refreshToken?: string;

    private tokenExpiresAt?: number;
    private authenticationPromise?: Promise<void>;

    constructor(
        private readonly http: AxiosInstance,
        private readonly clientId: string,
        private readonly clientSecret: string,
        private readonly omadacId: string
    ) {}

    /**
     * Get the current access token, refreshing if necessary.
     */
    public async getAccessToken(): Promise<string> {
        await this.ensureAccessToken();
        return this.accessToken ?? '';
    }

    /**
     * Clear the current authentication token.
     */
    public clearToken(rejectedAccessToken?: string): void {
        // A late rejection for an old token must not invalidate a newer login.
        if (rejectedAccessToken !== undefined && this.accessToken !== rejectedAccessToken) {
            return;
        }
        this.accessToken = undefined;
        this.refreshToken = undefined;
        this.tokenExpiresAt = undefined;
    }

    /**
     * Ensure a valid access token is available, refreshing or re-authenticating if necessary.
     */
    private ensureAccessToken(): Promise<void> {
        if (this.authenticationPromise) {
            return this.authenticationPromise;
        }
        if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
            return Promise.resolve();
        }

        this.authenticationPromise = this.refreshOrAuthenticate().finally(() => {
            this.authenticationPromise = undefined;
        });
        return this.authenticationPromise;
    }

    private async refreshOrAuthenticate(): Promise<void> {
        if (this.refreshToken) {
            try {
                await this.authenticate('refresh_token');
                return;
            } catch {
                this.clearToken();
            }
        }

        try {
            await this.authenticate('client_credentials');
        } catch (error) {
            this.clearToken();
            throw error;
        }
    }

    /**
     * Authenticate with the Omada controller using the specified grant type.
     */
    private async authenticate(grantType: 'client_credentials' | 'refresh_token'): Promise<void> {
        const params: Record<string, string> = { grant_type: grantType };
        const body: Record<string, string> = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
        };

        if (grantType === 'client_credentials') {
            body.omadacId = this.omadacId;
        } else {
            if (!this.refreshToken) {
                throw new Error('No refresh token available to refresh the access token');
            }

            params.refresh_token = this.refreshToken;
        }

        try {
            const { data } = await this.http.post<OmadaApiResponse<TokenResult>>('/openapi/authorize/token', body, { params });

            if (data.errorCode !== 0) {
                logger.error('Omada authentication error', {
                    errorCode: data.errorCode,
                    message: data.msg,
                });
                throw new Error(data.msg ?? 'Omada authentication failed');
            }

            const token = data.result;
            if (!token || typeof token.accessToken !== 'string' || token.accessToken.trim().length === 0) {
                throw new Error('Omada authentication returned no valid access token');
            }
            this.setToken(token);
        } catch (error) {
            logger.error('Omada authentication failed', {
                grantType,
                baseUrl: this.http.defaults.baseURL,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * Store the authentication token and calculate expiration time.
     */
    private setToken(token: TokenResult): void {
        this.accessToken = token.accessToken;
        this.refreshToken = token.refreshToken;

        const expiresInSeconds = Number.isFinite(token.expiresIn) ? token.expiresIn : 0;
        const expiresInMs = Math.max(expiresInSeconds - TOKEN_EXPIRY_BUFFER_SECONDS, 0) * 1000;
        this.tokenExpiresAt = Date.now() + expiresInMs;
    }
}
