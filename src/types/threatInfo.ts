export interface ThreatInfo {
    id?: string;
    omadacId?: string;
    siteId?: string;
    siteName?: string;
    time?: number;
    severity?: number;
    service?: string;
    signature?: string;
    category?: number;
    activity?: string;
    dataUsage?: number;
    srcIp?: string;
    dstIp?: string;
    srcCountry?: string;
    dstCountry?: string;
    protocol?: string;
    sid?: number;
    srcLatitude?: number;
    srcLongitude?: number;
    dstLatitude?: number;
    dstLongitude?: number;
    archived?: boolean;
    classification?: string;
    createTime?: number;
}

export interface GetThreatListOptions {
    siteList?: string;
    archived: boolean;
    page: number;
    pageSize: number;
    startTime: number;
    endTime: number;
    severity?: number;
    sortTime?: 'asc' | 'desc';
    searchKey?: string;
}
