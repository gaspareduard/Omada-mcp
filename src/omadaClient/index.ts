import https from 'node:https';

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

import type { EnvironmentConfig } from '../config.js';
import type {
    ActiveClientInfo,
    ClientActivity,
    ClientPastConnection,
    CustomHeaders,
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
    public async listSites(customHeaders?: CustomHeaders): Promise<OmadaSiteSummary[]> {
        return await this.siteOps.listSites(customHeaders);
    }

    // Device operations
    public async listDevices(siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaDeviceInfo[]> {
        return await this.deviceOps.listDevices(siteId, customHeaders);
    }

    public async getDevice(identifier: string, siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaDeviceInfo | undefined> {
        return await this.deviceOps.getDevice(identifier, siteId, customHeaders);
    }

    public async getSwitchStackDetail(stackId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<OswStackDetail> {
        return await this.deviceOps.getSwitchStackDetail(stackId, siteId, customHeaders);
    }

    public async searchDevices(searchKey: string, customHeaders?: CustomHeaders): Promise<OmadaDeviceInfo[]> {
        return await this.deviceOps.searchDevices(searchKey, customHeaders);
    }

    public async listDevicesStats(options: GetDeviceStatsOptions, customHeaders?: CustomHeaders): Promise<OmadaDeviceStats> {
        return await this.deviceOps.listDevicesStats(options, customHeaders);
    }

    // Client operations
    public async listClients(siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaClientInfo[]> {
        return await this.clientOps.listClients(siteId, customHeaders);
    }

    public async getClient(identifier: string, siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaClientInfo | undefined> {
        return await this.clientOps.getClient(identifier, siteId, customHeaders);
    }

    public async listMostActiveClients(siteId?: string, customHeaders?: CustomHeaders): Promise<ActiveClientInfo[]> {
        return await this.clientOps.listMostActiveClients(siteId, customHeaders);
    }

    public async listClientsActivity(options?: GetClientActivityOptions, customHeaders?: CustomHeaders): Promise<ClientActivity[]> {
        return await this.clientOps.listClientsActivity(options, customHeaders);
    }

    public async listClientsPastConnections(
        options: ListClientsPastConnectionsOptions,
        customHeaders?: CustomHeaders
    ): Promise<ClientPastConnection[]> {
        return await this.clientOps.listClientsPastConnections(options, customHeaders);
    }

    // Security operations
    public async getThreatList(options: GetThreatListOptions, customHeaders?: CustomHeaders): Promise<PaginatedResult<ThreatInfo>> {
        return await this.securityOps.getThreatList(options, customHeaders);
    }

    // Network operations
    public async getInternetInfo(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getInternetInfo(siteId, customHeaders);
    }

    public async getPortForwardingStatus(
        type: 'User' | 'UPnP',
        siteId?: string,
        page = 1,
        pageSize = 10,
        customHeaders?: CustomHeaders
    ): Promise<PaginatedResult<unknown>> {
        return await this.networkOps.getPortForwardingStatus(type, siteId, page, pageSize, customHeaders);
    }

    public async getLanNetworkList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.getLanNetworkList(siteId, customHeaders);
    }

    public async getLanProfileList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.getLanProfileList(siteId, customHeaders);
    }

    public async getWlanGroupList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.getWlanGroupList(siteId, customHeaders);
    }

    public async getSsidList(wlanId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.getSsidList(wlanId, siteId, customHeaders);
    }

    public async getSsidDetail(wlanId: string, ssidId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSsidDetail(wlanId, ssidId, siteId, customHeaders);
    }

    public async getFirewallSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getFirewallSetting(siteId, customHeaders);
    }

    // Generic API call
    public async callApi<T = unknown>(config: AxiosRequestConfig, customHeaders?: CustomHeaders): Promise<T> {
        return await this.request.request<T>(config, true, customHeaders);
    }

    /**
     * Build a full Omada API path from a relative path.
     * @param relativePath - The relative path to append to the base API path
     * @param version - The API version to use (default: 'v1')
     */
    private buildOmadaPath(relativePath: string, version = 'v1'): string {
        const normalized = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
        return `/openapi/${version}/${encodeURIComponent(this.omadacId)}${normalized}`;
    }
}
