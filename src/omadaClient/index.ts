import https from 'node:https';

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

import type { EnvironmentConfig } from '../config.js';
import type {
    ActiveClientInfo,
    ClientActivity,
    ClientPastConnection,
    GetClientActivityOptions,
    GetDeviceStatsOptions,
    GetThreatListOptions,
    ListClientsPastConnectionsOptions,
    OmadaClientInfo,
    OmadaDeviceInfo,
    OmadaDeviceStats,
    OmadaSiteSummary,
    OswStackDetail,
    PaginatedResult,
    ThreatInfo,
} from '../types/index.js';

import { AuthManager } from './auth.js';
import { ClientOperations } from './client.js';
import { DeviceOperations } from './device.js';
import { NetworkOperations } from './network.js';
import { RequestHandler } from './request.js';
import { SecurityOperations } from './security.js';
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

    private readonly securityOps: SecurityOperations;

    private readonly networkOps: NetworkOperations;

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
        this.securityOps = new SecurityOperations(this.request, this.buildOmadaPath.bind(this));
        this.networkOps = new NetworkOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
    }

    // Site operations
    public async listSites(): Promise<OmadaSiteSummary[]> {
        return await this.siteOps.listSites();
    }

    // Device operations
    public async listDevices(siteId?: string): Promise<OmadaDeviceInfo[]> {
        return await this.deviceOps.listDevices(siteId);
    }

    public async getDevice(identifier: string, siteId?: string): Promise<OmadaDeviceInfo | undefined> {
        return await this.deviceOps.getDevice(identifier, siteId);
    }

    public async getSwitchStackDetail(stackId: string, siteId?: string): Promise<OswStackDetail> {
        return await this.deviceOps.getSwitchStackDetail(stackId, siteId);
    }

    public async searchDevices(searchKey: string): Promise<OmadaDeviceInfo[]> {
        return await this.deviceOps.searchDevices(searchKey);
    }

    public async listDevicesStats(options: GetDeviceStatsOptions): Promise<OmadaDeviceStats> {
        return await this.deviceOps.listDevicesStats(options);
    }

    // Client operations
    public async listClients(siteId?: string): Promise<OmadaClientInfo[]> {
        return await this.clientOps.listClients(siteId);
    }

    public async getClient(identifier: string, siteId?: string): Promise<OmadaClientInfo | undefined> {
        return await this.clientOps.getClient(identifier, siteId);
    }

    public async listMostActiveClients(siteId?: string): Promise<ActiveClientInfo[]> {
        return await this.clientOps.listMostActiveClients(siteId);
    }

    public async listClientsActivity(options?: GetClientActivityOptions): Promise<ClientActivity[]> {
        return await this.clientOps.listClientsActivity(options);
    }

    public async listClientsPastConnections(options: ListClientsPastConnectionsOptions): Promise<ClientPastConnection[]> {
        return await this.clientOps.listClientsPastConnections(options);
    }

    // Security operations
    public async getThreatList(options: GetThreatListOptions): Promise<PaginatedResult<ThreatInfo>> {
        return await this.securityOps.getThreatList(options);
    }

    // Network operations
    public async getInternetInfo(siteId?: string): Promise<unknown> {
        return await this.networkOps.getInternetInfo(siteId);
    }

    public async getPortForwardingStatus(
        type: 'User' | 'UPnP',
        siteId?: string,
        page?: number,
        pageSize?: number
    ): Promise<PaginatedResult<unknown>> {
        return await this.networkOps.getPortForwardingStatus(type, siteId, page, pageSize);
    }

    public async getLanNetworkList(siteId?: string): Promise<unknown[]> {
        return await this.networkOps.getLanNetworkList(siteId);
    }

    public async getLanProfileList(siteId?: string): Promise<unknown[]> {
        return await this.networkOps.getLanProfileList(siteId);
    }

    public async getWlanGroupList(siteId?: string): Promise<unknown[]> {
        return await this.networkOps.getWlanGroupList(siteId);
    }

    public async getSsidList(wlanId: string, siteId?: string): Promise<unknown[]> {
        return await this.networkOps.getSsidList(wlanId, siteId);
    }

    public async getSsidDetail(wlanId: string, ssidId: string, siteId?: string): Promise<unknown> {
        return await this.networkOps.getSsidDetail(wlanId, ssidId, siteId);
    }

    public async getFirewallSetting(siteId?: string): Promise<unknown> {
        return await this.networkOps.getFirewallSetting(siteId);
    }

    // Generic API call
    public async callApi<T = unknown>(config: AxiosRequestConfig): Promise<T> {
        return await this.request.request<T>(config);
    }

    /**
     * Build a full Omada API path from a relative path.
     */
    private buildOmadaPath(relativePath: string): string {
        const normalized = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
        return `/openapi/v1/${encodeURIComponent(this.omadacId)}${normalized}`;
    }
}
