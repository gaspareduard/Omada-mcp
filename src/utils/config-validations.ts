/**
 * Configuration validation utilities
 * All environment variable validation logic should be centralized here
 */

import { isIPv4, isIPv6 } from 'node:net';

/**
 * Validates IPv4 addresses
 * @param value - The string to validate
 * @returns true if valid IPv4 address, false otherwise
 */
export function isValidIpv4Address(value: string): boolean {
    return isIPv4(value);
}

/**
 * Validates IPv6 addresses
 * @param value - The string to validate
 * @returns true if valid IPv6 address, false otherwise
 */
export function isValidIpv6Address(value: string): boolean {
    return isIPv6(value);
}

/**
 * Validates IPv4 or IPv6 addresses
 * @param value - The string to validate
 * @returns true if valid IP address, false otherwise
 */
export function isValidIpAddress(value: string): boolean {
    return isValidIpv4Address(value) || isValidIpv6Address(value);
}

/**
 * Validates hostnames according to RFC standards
 * @param value - The string to validate
 * @returns true if valid hostname, false otherwise
 */
export function isValidHostname(value: string): boolean {
    // Check for special case of localhost
    if (value === 'localhost') {
        return true;
    }

    // Check if it's an IP address (should not be considered a hostname)
    if (isValidIpAddress(value)) {
        return false;
    }

    // Hostname regex following RFC 1123
    const hostnameRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    return hostnameRegex.test(value);
}

/**
 * Validates allowed origin values (hostname, IPv4, IPv6, or wildcard)
 * @param value - The string to validate
 * @returns true if valid origin, false otherwise
 */
export function isValidOrigin(value: string): boolean {
    // Allow wildcard to disable origin validation
    if (value === '*') {
        return true;
    }
    return isValidIpAddress(value) || isValidHostname(value);
}

/**
 * Validates bind address (must be a valid IP address)
 * @param value - The string to validate
 * @returns true if valid bind address, false otherwise
 */
export function isValidBindAddress(value: string): boolean {
    return isValidIpAddress(value);
}

/**
 * Validates an array of origin values
 * @param origins - Array of origin strings to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateOrigins(origins: string[]): { isValid: boolean; error?: string } {
    for (const origin of origins) {
        if (!isValidOrigin(origin)) {
            return {
                isValid: false,
                error: `Invalid origin: ${origin}`,
            };
        }
    }
    return { isValid: true };
}

/**
 * Validates bind address with detailed error message
 * @param bindAddr - The bind address to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateBindAddress(bindAddr: string): { isValid: boolean; error?: string } {
    if (!isValidBindAddress(bindAddr)) {
        return {
            isValid: false,
            error: `Invalid bind address: ${bindAddr}. Must be a valid IPv4 or IPv6 address.`,
        };
    }
    return { isValid: true };
}

/**
 * Validates and resolves port number with fallback
 * @param value - The port number to validate
 * @param fallback - The fallback port number if validation fails
 * @returns The validated port or fallback
 */
export function resolvePort(value: number | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }

    if (!Number.isInteger(value) || value <= 0 || value > 65_535) {
        return fallback;
    }

    return value;
}

/**
 * Normalizes path by ensuring it starts with / and doesn't end with /
 * @param path - The path to normalize
 * @returns The normalized path
 */
export function normalizePath(path: string): string {
    const startsWithSlash = path.startsWith('/') ? path : `/${path}`;
    if (startsWithSlash.length > 1 && startsWithSlash.endsWith('/')) {
        const trimmed = startsWithSlash.replace(/\/+$/, '');
        return trimmed.length === 0 ? '/' : trimmed;
    }

    return startsWithSlash;
}
