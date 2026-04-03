import { describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import {
    createEapAclInputSchema,
    createGatewayAclInputSchema,
    findAclById,
    findCreatedAclByDescription,
    getAclRecordId,
    setAclConfigTypeInputSchema,
    updateEapAclInputSchema,
    validateEapAclPayloadReferences,
} from '../../src/tools/gatewayAclShared.js';

describe('tools/gatewayAclShared', () => {
    it('finds ACL records by id or aclId', () => {
        expect(findAclById([{ id: 'one' }, { aclId: 'two' }], 'two')).toEqual({ aclId: 'two' });
        expect(findAclById([{ id: 'one' }], 'missing')).toBeUndefined();
    });

    it('extracts ACL ids and finds newly created ACLs by description', () => {
        expect(getAclRecordId({ aclId: 'two' })).toBe('two');
        expect(
            findCreatedAclByDescription(
                [{ id: 'acl-1', description: 'Existing' }],
                [
                    { id: 'acl-1', description: 'Existing' },
                    { id: 'acl-2', description: 'Created now' },
                ],
                'Created now'
            )
        ).toEqual({ id: 'acl-2', description: 'Created now' });
    });

    it('validates gateway ACL creation payloads', () => {
        const result = createGatewayAclInputSchema.parse({
            payload: {
                description: 'Guests to WAN',
                status: true,
                policy: 0,
                protocols: [6],
                sourceIds: ['lan-1'],
                sourceType: 0,
                destinationType: 0,
                direction: { lanToWan: true },
                stateMode: 0,
                syslog: false,
            },
        });

        expect(result.payload.description).toBe('Guests to WAN');
    });

    it('validates EAP ACL update payloads', () => {
        const result = updateEapAclInputSchema.parse({
            aclId: 'acl-1',
            payload: {
                description: 'Wireless guests',
                status: true,
                policy: 1,
                protocols: [17],
                sourceIds: ['ssid-1'],
                sourceType: 4,
                destinationType: 0,
            },
        });

        expect(result.aclId).toBe('acl-1');
    });

    it('rejects unsupported ACL mode values', () => {
        expect(() => setAclConfigTypeInputSchema.parse({ mode: 2 })).toThrow('mode must be 0');
    });

    it('accepts create EAP ACL input without aclId', () => {
        expect(() =>
            createEapAclInputSchema.parse({
                payload: {
                    description: 'ok',
                    status: true,
                    policy: 1,
                    protocols: [6],
                    sourceIds: ['net-1'],
                    sourceType: 0,
                    destinationType: 0,
                },
            })
        ).not.toThrow();
    });

    it('validateEapAclPayloadReferences rejects unknown LAN ids', async () => {
        const mockClient = {
            getLanNetworkList: vi.fn().mockResolvedValue([{ id: 'net-1' }]),
            getWlanGroupList: vi.fn().mockResolvedValue([]),
        } as unknown as OmadaClient;

        await expect(
            validateEapAclPayloadReferences(
                mockClient,
                {
                    description: 'Bad LAN',
                    status: true,
                    policy: 0,
                    protocols: [6],
                    sourceIds: ['net-missing'],
                    sourceType: 0,
                    destinationType: 0,
                },
                'site-1'
            )
        ).rejects.toThrow('Unknown LAN network ids in sourceIds: net-missing.');

        await expect(
            validateEapAclPayloadReferences(
                mockClient,
                {
                    description: 'Bad destination',
                    status: true,
                    policy: 0,
                    protocols: [6],
                    sourceIds: ['net-1'],
                    destinationIds: ['net-missing'],
                    sourceType: 0,
                    destinationType: 0,
                },
                'site-1'
            )
        ).rejects.toThrow('Unknown LAN network ids in destinationIds: net-missing.');
    });

    it('validateEapAclPayloadReferences rejects unknown SSID ids for wireless source ACLs', async () => {
        const mockClient = {
            getLanNetworkList: vi.fn().mockResolvedValue([{ id: 'net-1' }]),
            getWlanGroupList: vi.fn().mockResolvedValue([{ wlanId: 'wlan-1' }]),
            getSsidList: vi.fn().mockResolvedValue([{ id: 'ssid-1' }]),
        } as unknown as OmadaClient;

        await expect(
            validateEapAclPayloadReferences(
                mockClient,
                {
                    description: 'Bad SSID',
                    status: true,
                    policy: 0,
                    protocols: [6],
                    sourceIds: ['ssid-missing'],
                    sourceType: 4,
                    destinationType: 0,
                },
                'site-1'
            )
        ).rejects.toThrow('Unknown SSID ids in sourceIds: ssid-missing.');
    });
});
