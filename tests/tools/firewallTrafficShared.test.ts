import { describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import {
    accessControlPayloadSchema,
    appControlCreatePayloadSchema,
    appControlUpdatePayloadSchema,
    bandwidthControlRulePayloadSchema,
    extractGridRecords,
    findGridRecordById,
    parseAppControlPayload,
    setAccessControlInputSchema,
    setAppControlRuleInputSchema,
    setBandwidthControlRuleInputSchema,
    validateBandwidthControlPayloadReferences,
} from '../../src/tools/firewallTrafficShared.js';

describe('tools/firewallTrafficShared', () => {
    it('extractGridRecords returns object entries and ignores non-objects', () => {
        expect(extractGridRecords({ data: [{ id: 'r1' }, null, 'bad'] })).toEqual([{ id: 'r1' }]);
        expect(extractGridRecords(undefined)).toEqual([]);
    });

    it('finds a grid record by id-like fields', () => {
        expect(findGridRecordById({ data: [{ ruleId: 10 }, { id: '11' }] }, '10')).toEqual({ ruleId: 10 });
        expect(findGridRecordById({ data: [{ aclId: '12' }] }, '12')).toEqual({ aclId: '12' });
        expect(findGridRecordById({ data: [{ id: '11' }] }, 'missing')).toBeUndefined();
    });

    it('accepts create and update application control input payload shells', () => {
        expect(
            setAppControlRuleInputSchema.parse({
                payload: {
                    ruleName: 'Block social',
                    schedule: 'always',
                    qos: false,
                    applications: [1001],
                    selectType: 'include',
                },
            }).payload
        ).toEqual({
            ruleName: 'Block social',
            schedule: 'always',
            qos: false,
            applications: [1001],
            selectType: 'include',
        });
    });

    it('requires qosClass when qos is enabled for create and update payloads', () => {
        expect(() =>
            appControlCreatePayloadSchema.parse({
                ruleName: 'Missing class',
                schedule: 'always',
                qos: true,
                applications: [1001],
                selectType: 'include',
            })
        ).toThrow('qosClass is required when qos is enabled.');

        expect(() =>
            appControlUpdatePayloadSchema.parse({
                ruleName: 'Missing class',
                schedule: 'always',
                qos: true,
                applications: [1001],
            })
        ).toThrow('qosClass is required when qos is enabled.');
    });

    it('validates create payloads require selectType while update payloads do not', () => {
        expect(() =>
            appControlCreatePayloadSchema.parse({
                ruleName: 'Missing select type',
                schedule: 'always',
                qos: false,
                applications: [1001],
            })
        ).toThrow();

        expect(
            appControlUpdatePayloadSchema.parse({
                ruleName: 'Update rule',
                schedule: 'always',
                qos: false,
                applications: [1001],
            })
        ).toEqual({
            ruleName: 'Update rule',
            schedule: 'always',
            qos: false,
            applications: [1001],
        });
    });

    it('parseAppControlPayload validates application ids against the controller inventory', async () => {
        const invalidMockClient = {
            getApplications: vi.fn().mockResolvedValue({ data: [{ applicationId: 1001 }, { applicationId: 1002 }] }),
        } as unknown as OmadaClient;
        const validMockClient = {
            getApplications: vi.fn().mockResolvedValue({ data: [{ applicationId: 1001 }, { applicationId: 1002 }] }),
        } as unknown as OmadaClient;

        await expect(
            parseAppControlPayload(
                invalidMockClient,
                undefined,
                {
                    ruleName: 'Bad app id',
                    schedule: 'always',
                    qos: false,
                    applications: [9999],
                    selectType: 'include',
                },
                'site-1'
            )
        ).rejects.toThrow('Unknown application ids: 9999.');

        await expect(
            parseAppControlPayload(
                validMockClient,
                'rule-1',
                {
                    ruleName: 'Good update',
                    schedule: 'always',
                    qos: false,
                    applications: [1001],
                },
                'site-1'
            )
        ).resolves.toEqual({
            ruleName: 'Good update',
            schedule: 'always',
            qos: false,
            applications: [1001],
        });
    });

    it('validates a bandwidth control payload', () => {
        const result = setBandwidthControlRuleInputSchema.parse({
            payload: {
                name: 'Guests cap',
                status: true,
                sourceIds: ['net-guests'],
                wanPortIds: ['wan1'],
                upstreamBandwidth: 10000,
                upstreamBandwidthUnit: 2,
                downstreamBandwidth: 25000,
                downstreamBandwidthUnit: 2,
                mode: 1,
            },
        });

        expect(result.payload.name).toBe('Guests cap');
    });

    it('rejects unsupported bandwidth units and modes', () => {
        expect(() =>
            bandwidthControlRulePayloadSchema.parse({
                name: 'Bad units',
                status: true,
                sourceIds: ['net-guests'],
                wanPortIds: ['wan1'],
                upstreamBandwidth: 100,
                upstreamBandwidthUnit: 3,
                downstreamBandwidth: 200,
                downstreamBandwidthUnit: 2,
                mode: 0,
            })
        ).toThrow('upstreamBandwidthUnit must be 1 (Kbps) or 2 (Mbps).');
    });

    it('validateBandwidthControlPayloadReferences rejects unknown LAN and WAN ids', async () => {
        const mockClient = {
            getLanNetworkList: vi.fn().mockResolvedValue([{ id: 'net-1' }]),
            getInternetBasicPortInfo: vi.fn().mockResolvedValue({ portUuids: ['wan-1'], wanPortSettings: [{ portId: 'wan-2' }] }),
            getInternetInfo: vi.fn().mockResolvedValue({ portUuids: ['wan-1'], wanPortSettings: [{ portId: 'wan-2' }] }),
        } as unknown as OmadaClient;

        await expect(
            validateBandwidthControlPayloadReferences(
                mockClient,
                {
                    name: 'Bad source',
                    status: true,
                    sourceType: 0,
                    sourceIds: ['net-missing'],
                    wanPortIds: ['wan-1'],
                    upstreamBandwidth: 10,
                    upstreamBandwidthUnit: 2,
                    downstreamBandwidth: 20,
                    downstreamBandwidthUnit: 2,
                    mode: 1,
                },
                'site-1'
            )
        ).rejects.toThrow('Unknown LAN network ids in sourceIds: net-missing.');

        await expect(
            validateBandwidthControlPayloadReferences(
                mockClient,
                {
                    name: 'Bad wan',
                    status: true,
                    sourceType: 0,
                    sourceIds: ['net-1'],
                    wanPortIds: ['wan-missing'],
                    upstreamBandwidth: 10,
                    upstreamBandwidthUnit: 2,
                    downstreamBandwidth: 20,
                    downstreamBandwidthUnit: 2,
                    mode: 1,
                },
                'site-1'
            )
        ).rejects.toThrow('Unknown WAN port ids: wan-missing.');
    });

    it('validateBandwidthControlPayloadReferences accepts WAN ids returned by internet basic-info portList', async () => {
        const mockClient = {
            getLanNetworkList: vi.fn().mockResolvedValue([{ id: 'net-1' }]),
            getInternetBasicPortInfo: vi.fn().mockResolvedValue({ portList: [{ portId: 'wan-1' }] }),
        } as unknown as OmadaClient;

        await expect(
            validateBandwidthControlPayloadReferences(
                mockClient,
                {
                    name: 'Good wan',
                    status: false,
                    sourceType: 0,
                    sourceIds: ['net-1'],
                    wanPortIds: ['wan-1'],
                    upstreamBandwidth: 1,
                    upstreamBandwidthUnit: 2,
                    downstreamBandwidth: 2,
                    downstreamBandwidthUnit: 2,
                    mode: 1,
                },
                'site-1'
            )
        ).resolves.toBeUndefined();
    });

    it('requires policy lists when access control toggles are enabled', () => {
        expect(() =>
            setAccessControlInputSchema.parse({
                payload: {
                    preAuthAccessEnable: true,
                    freeAuthClientEnable: false,
                },
            })
        ).toThrow('preAuthAccessPolicies is required');
    });

    it('requires URL details for pre-auth URL policies', () => {
        expect(() =>
            accessControlPayloadSchema.parse({
                preAuthAccessEnable: true,
                preAuthAccessPolicies: [{ type: 2 }],
                freeAuthClientEnable: false,
            })
        ).toThrow('url is required when type is 2.');
    });

    it('requires client IP or MAC details for free-auth policies', () => {
        expect(() =>
            accessControlPayloadSchema.parse({
                preAuthAccessEnable: false,
                freeAuthClientEnable: true,
                freeAuthClientPolicies: [{ type: 3 }],
            })
        ).toThrow('clientIp is required when type is 3.');

        expect(() =>
            accessControlPayloadSchema.parse({
                preAuthAccessEnable: false,
                freeAuthClientEnable: true,
                freeAuthClientPolicies: [{ type: 4 }],
            })
        ).toThrow('clientMac is required when type is 4.');
    });

    it('accepts a fully specified access control payload', () => {
        const result = accessControlPayloadSchema.parse({
            preAuthAccessEnable: true,
            preAuthAccessPolicies: [{ type: 1, ip: '192.168.40.0', subnetMask: 24 }],
            freeAuthClientEnable: true,
            freeAuthClientPolicies: [{ type: 4, clientMac: 'AA:BB:CC:DD:EE:FF' }],
        });

        expect(result.preAuthAccessPolicies).toHaveLength(1);
        expect(result.freeAuthClientPolicies).toHaveLength(1);
    });
});
