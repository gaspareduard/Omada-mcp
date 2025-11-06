export interface OmadaDeviceStats {
    page: number;
    pageSize: number;
    totalRows: number;
    data: OmadaDeviceStatItem[];
}

export interface OmadaDeviceStatItem {
    mac?: string;
    name?: string;
    model?: string;
    sn?: string;
    type?: string;
    status?: string;
    site?: string;
    siteId?: string;
    tag?: string;
    deviceSeriesType?: number;
    [key: string]: unknown;
}

export interface GetDeviceStatsOptions {
    page: number;
    pageSize: number;
    searchMacs?: string;
    searchNames?: string;
    searchModels?: string;
    searchSns?: string;
    filterTag?: string;
    filterDeviceSeriesType?: string;
}
