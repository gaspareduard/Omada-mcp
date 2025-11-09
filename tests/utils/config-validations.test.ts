import { describe, expect, it } from 'vitest';
import {
    isValidBindAddress,
    isValidHostname,
    isValidIpAddress,
    isValidIpv4Address,
    isValidIpv6Address,
    isValidOrigin,
    normalizePath,
    resolvePort,
    validateBindAddress,
    validateOrigins,
} from '../../src/utils/config-validations.js';

describe('config-validations', () => {
    describe('isValidIpv4Address', () => {
        it('should validate correct IPv4 addresses', () => {
            expect(isValidIpv4Address('127.0.0.1')).toBe(true);
            expect(isValidIpv4Address('192.168.1.1')).toBe(true);
            expect(isValidIpv4Address('0.0.0.0')).toBe(true);
            expect(isValidIpv4Address('255.255.255.255')).toBe(true);
            expect(isValidIpv4Address('10.0.0.1')).toBe(true);
        });

        it('should reject invalid IPv4 addresses', () => {
            expect(isValidIpv4Address('256.1.1.1')).toBe(false);
            expect(isValidIpv4Address('192.168.1')).toBe(false);
            expect(isValidIpv4Address('192.168.1.1.1')).toBe(false);
            expect(isValidIpv4Address('abc.def.ghi.jkl')).toBe(false);
            expect(isValidIpv4Address('')).toBe(false);
            expect(isValidIpv4Address('localhost')).toBe(false);
        });
    });

    describe('isValidIpv6Address', () => {
        it('should validate correct IPv6 addresses', () => {
            expect(isValidIpv6Address('::1')).toBe(true);
            expect(isValidIpv6Address('::')).toBe(true);
            expect(isValidIpv6Address('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
        });

        it('should reject invalid IPv6 addresses', () => {
            expect(isValidIpv6Address('127.0.0.1')).toBe(false);
            expect(isValidIpv6Address('localhost')).toBe(false);
            expect(isValidIpv6Address('')).toBe(false);
            expect(isValidIpv6Address('invalid')).toBe(false);
        });
    });

    describe('isValidIpAddress', () => {
        it('should validate both IPv4 and IPv6 addresses', () => {
            // IPv4
            expect(isValidIpAddress('127.0.0.1')).toBe(true);
            expect(isValidIpAddress('192.168.1.1')).toBe(true);

            // IPv6
            expect(isValidIpAddress('::1')).toBe(true);
            expect(isValidIpAddress('::')).toBe(true);
        });

        it('should reject invalid IP addresses', () => {
            expect(isValidIpAddress('localhost')).toBe(false);
            expect(isValidIpAddress('256.1.1.1')).toBe(false);
            expect(isValidIpAddress('')).toBe(false);
            expect(isValidIpAddress('not-an-ip')).toBe(false);
        });
    });

    describe('isValidHostname', () => {
        it('should validate correct hostnames', () => {
            expect(isValidHostname('localhost')).toBe(true);
            expect(isValidHostname('example.com')).toBe(true);
            expect(isValidHostname('subdomain.example.com')).toBe(true);
            expect(isValidHostname('my-server')).toBe(true);
            expect(isValidHostname('server1')).toBe(true);
            expect(isValidHostname('a.b.c.d.example.com')).toBe(true);
        });

        it('should reject invalid hostnames', () => {
            expect(isValidHostname('')).toBe(false);
            expect(isValidHostname('-invalid')).toBe(false);
            expect(isValidHostname('invalid-')).toBe(false);
            expect(isValidHostname('inv@lid')).toBe(false);
            expect(isValidHostname('127.0.0.1')).toBe(false); // IP addresses should not match
        });
    });

    describe('isValidOrigin', () => {
        it('should validate hostnames', () => {
            expect(isValidOrigin('localhost')).toBe(true);
            expect(isValidOrigin('example.com')).toBe(true);
            expect(isValidOrigin('subdomain.example.com')).toBe(true);
        });

        it('should validate IPv4 addresses', () => {
            expect(isValidOrigin('127.0.0.1')).toBe(true);
            expect(isValidOrigin('192.168.1.1')).toBe(true);
            expect(isValidOrigin('0.0.0.0')).toBe(true);
        });

        it('should validate IPv6 addresses', () => {
            expect(isValidOrigin('::1')).toBe(true);
            expect(isValidOrigin('::')).toBe(true);
        });

        it('should reject invalid origins', () => {
            expect(isValidOrigin('')).toBe(false);
            expect(isValidOrigin('inv@lid')).toBe(false);
            expect(isValidOrigin('-invalid')).toBe(false);
        });
    });

    describe('isValidBindAddress', () => {
        it('should validate IP addresses as bind addresses', () => {
            expect(isValidBindAddress('127.0.0.1')).toBe(true);
            expect(isValidBindAddress('0.0.0.0')).toBe(true);
            expect(isValidBindAddress('::1')).toBe(true);
            expect(isValidBindAddress('192.168.1.1')).toBe(true);
        });

        it('should reject non-IP bind addresses', () => {
            expect(isValidBindAddress('localhost')).toBe(false);
            expect(isValidBindAddress('example.com')).toBe(false);
            expect(isValidBindAddress('')).toBe(false);
            expect(isValidBindAddress('256.1.1.1')).toBe(false);
        });
    });

    describe('validateOrigins', () => {
        it('should accept valid origins', () => {
            const result1 = validateOrigins(['127.0.0.1', 'localhost']);
            expect(result1.isValid).toBe(true);
            expect(result1.error).toBeUndefined();

            const result2 = validateOrigins(['example.com', '192.168.1.1', '::1']);
            expect(result2.isValid).toBe(true);
            expect(result2.error).toBeUndefined();

            const result3 = validateOrigins(['*']);
            expect(result3.isValid).toBe(true);
            expect(result3.error).toBeUndefined();
        });

        it('should reject invalid origins', () => {
            const result1 = validateOrigins(['127.0.0.1', 'inv@lid']);
            expect(result1.isValid).toBe(false);
            expect(result1.error).toContain('Invalid origin');

            const result2 = validateOrigins(['-invalid']);
            expect(result2.isValid).toBe(false);
            expect(result2.error).toContain('Invalid origin');
        });

        it('should handle empty arrays', () => {
            const result = validateOrigins([]);
            expect(result.isValid).toBe(true);
        });
    });

    describe('validateBindAddress', () => {
        it('should validate valid bind addresses', () => {
            const result1 = validateBindAddress('127.0.0.1');
            expect(result1.isValid).toBe(true);
            expect(result1.error).toBeUndefined();

            const result2 = validateBindAddress('::1');
            expect(result2.isValid).toBe(true);
            expect(result2.error).toBeUndefined();
        });

        it('should reject invalid bind addresses with error messages', () => {
            const result1 = validateBindAddress('localhost');
            expect(result1.isValid).toBe(false);
            expect(result1.error).toContain('localhost');
            expect(result1.error).toContain('IPv4 or IPv6');

            const result2 = validateBindAddress('example.com');
            expect(result2.isValid).toBe(false);
            expect(result2.error).toContain('example.com');
        });
    });

    describe('resolvePort', () => {
        it('should return the port if valid', () => {
            expect(resolvePort(3000, 8080)).toBe(3000);
            expect(resolvePort(80, 8080)).toBe(80);
            expect(resolvePort(65535, 8080)).toBe(65535);
            expect(resolvePort(1, 8080)).toBe(1);
        });

        it('should return fallback for invalid ports', () => {
            expect(resolvePort(undefined, 8080)).toBe(8080);
            expect(resolvePort(0, 8080)).toBe(8080);
            expect(resolvePort(-1, 8080)).toBe(8080);
            expect(resolvePort(65536, 8080)).toBe(8080);
            expect(resolvePort(70000, 8080)).toBe(8080);
        });

        it('should return fallback for non-integer values', () => {
            expect(resolvePort(3.14 as number, 8080)).toBe(8080);
        });
    });

    describe('normalizePath', () => {
        it('should ensure path starts with /', () => {
            expect(normalizePath('api')).toBe('/api');
            expect(normalizePath('mcp')).toBe('/mcp');
            expect(normalizePath('/api')).toBe('/api');
        });

        it('should remove trailing slashes', () => {
            expect(normalizePath('/api/')).toBe('/api');
            expect(normalizePath('/api/v1/')).toBe('/api/v1');
            expect(normalizePath('api/')).toBe('/api');
            expect(normalizePath('/api///')).toBe('/api');
        });

        it('should handle root path', () => {
            expect(normalizePath('/')).toBe('/');
        });

        it('should handle empty string', () => {
            expect(normalizePath('')).toBe('/');
        });
    });
});
