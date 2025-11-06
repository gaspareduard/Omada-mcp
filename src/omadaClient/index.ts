import https from 'node:https';

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

import type { EnvironmentConfig } from '../config.js';
import type { GetDeviceStatsOptions, OmadaClientInfo, OmadaDeviceInfo, OmadaDeviceStats, OmadaSiteSummary, OswStackDetail } from '../types/index.js';

import { AuthManager } from './auth.js';
import { ClientOperations } from './client.js';
import { DeviceOperations } from './device.js';
import { RequestHandler } from './request.js';
import { SiteOperations } from './site.js';

export type OmadaClientOptions = EnvironmentConfig;

/**
 * Main client for interacting with the TP-Link Omada API.
 * Organized by API tag with dedicated operation classes for each domain.
 */
export class OmadaClient {
    private readonly http: AxiosInstance;

    private readonly auth: AuthManager;

    private readonly request: RequestHandler;

    private readonly siteOps: SiteOperations;

    private readonly deviceOps: DeviceOperations;

    private readonly clientOps: ClientOperations;

    private readonly omadacId: string;

    constructor(options: OmadaClientOptions) {
        this.omadacId = options.omadacId;

        const axiosOptions: AxiosRequestConfig = {
            baseURL: options.baseUrl,
            httpsAgent: new https.Agent({ rejectUnauthorized: options.strictSsl }),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        };

        if (options.requestTimeout) {
            axiosOptions.timeout = options.requestTimeout;
        }

        this.http = axios.create(axiosOptions);

        // Initialize operation modules
        this.auth = new AuthManager(this.http, options.clientId, options.clientSecret, options.omadacId);
        this.request = new RequestHandler(this.http, this.auth);
        this.siteOps = new SiteOperations(this.request, this.buildOmadaPath.bind(this), options.siteId);
        this.deviceOps = new DeviceOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
        this.clientOps = new ClientOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
    }

    // Site operations
    public async listSites(): Promise<OmadaSiteSummary[]> {
        return this.siteOps.listSites();
    }

    // Device operations
    public async listDevices(siteId?: string): Promise<OmadaDeviceInfo[]> {
        return this.deviceOps.listDevices(siteId);
    }

    public async getDevice(identifier: string, siteId?: string): Promise<OmadaDeviceInfo | undefined> {
        return this.deviceOps.getDevice(identifier, siteId);
    }

    public async getSwitchStackDetail(stackId: string, siteId?: string): Promise<OswStackDetail> {
        return this.deviceOps.getSwitchStackDetail(stackId, siteId);
    }

    public async searchDevices(searchKey: string): Promise<OmadaDeviceInfo[]> {
        return this.deviceOps.searchDevices(searchKey);
    }

    public async listDevicesStats(options: GetDeviceStatsOptions): Promise<OmadaDeviceStats> {
        return this.deviceOps.listDevicesStats(options);
    }

    // Client operations
    public async listClients(siteId?: string): Promise<OmadaClientInfo[]> {
        return this.clientOps.listClients(siteId);
    }

    public async getClient(identifier: string, siteId?: string): Promise<OmadaClientInfo | undefined> {
        return this.clientOps.getClient(identifier, siteId);
    }

    // Generic API call
    public async callApi<T = unknown>(config: AxiosRequestConfig): Promise<T> {
        return this.request.request<T>(config);
    }

    /**
     * Build a full Omada API path from a relative path.
     */
    private buildOmadaPath(relativePath: string): string {
        const normalized = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
        return `/openapi/v1/${encodeURIComponent(this.omadacId)}${normalized}`;
    }
}
