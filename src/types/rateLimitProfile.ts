/**
 * Rate limit profile information from Omada API
 */
export interface RateLimitProfile {
    /** Profile ID */
    id: string;
    /** Profile name (1-64 characters) */
    name: string;
    /** Whether download limit is enabled */
    downLimitEnable: boolean;
    /** Download limit in Kbps (when downLimitEnable is true) */
    downLimit?: number;
    /** Whether upload limit is enabled */
    upLimitEnable: boolean;
    /** Upload limit in Kbps (when upLimitEnable is true) */
    upLimit?: number;
}

/**
 * Client rate limit setting
 */
export interface ClientRateLimitSetting {
    /** Rate limit profile ID (null when using custom rate limit) */
    rateLimitId?: string | null;
    /** Whether rate limit is enabled */
    enable: boolean;
    /** Whether upload limit is enabled (for custom rate limit) */
    upEnable?: boolean;
    /** Upload limit in Kbps (for custom rate limit) */
    upLimit?: number;
    /** Whether download limit is enabled (for custom rate limit) */
    downEnable?: boolean;
    /** Download limit in Kbps (for custom rate limit) */
    downLimit?: number;
}

/**
 * Request to update client rate limit setting
 */
export interface UpdateClientRateLimitRequest {
    /** Mode: 0 = custom rate limit, 1 = use rate limit profile */
    mode: 0 | 1;
    /** Rate limit profile ID (required when mode = 1) */
    rateLimitProfileId?: string;
    /** Custom rate limit settings (required when mode = 0) */
    customRateLimit?: {
        /** Whether rate limit is enabled */
        enable: boolean;
        /** Whether upload limit is enabled */
        upEnable?: boolean;
        /** Upload limit in Kbps */
        upLimit?: number;
        /** Whether download limit is enabled */
        downEnable?: boolean;
        /** Download limit in Kbps */
        downLimit?: number;
    };
}
