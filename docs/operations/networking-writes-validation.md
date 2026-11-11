# Networking write tools: validation record

These tools bring Omada to the networking use cases of the UniFi MCP server (`sirkirby/unifi-mcp`): VLAN segmentation, NAT and routing, DNS, filtering, VPN lifecycle, and device and client actions. They follow the 0.19 mutation contract in [the migration guide](0.19-migration.md).

## How the tools are built

- **Request validation.** `scripts/generate-request-schemas.mjs` generates strict Zod schemas from `docs/openapi/*.json`. The output is `src/omadaClient/requestSchemas.ts`, and `tests/omadaClient/requestSchemas.test.ts` runs the script's `--check` mode to fail when the file is stale. The schemas keep required fields and numeric bounds, reject unknown keys, and anchor documented patterns as full-string matches.
- **Controller requirements.** The controller enforces some rules that the schemas don't express: some are documented only in field prose, some not at all. `src/tools/payloadRequirements.ts` checks these so previews fail with a clear message instead of an opaque `General error` on apply.
- **Routes.** `src/omadaClient/siteConfig.ts` holds the new routes. `tests/omadaClient/siteConfig.test.ts` checks the method, version and path of each one against the tag spec.
- **Mutation contract.** `src/tools/resourceMutationShared.ts` implements the contract once for create, update, delete, settings and one-shot actions:
  - The tool previews by default.
  - It checks for name conflicts and that IDs exist before both preview and apply.
  - It sends at most one write. Controller rejections are returned with their error code, and transport failures are reconciled by reading, never by replaying the write.
  - It verifies by bounded readback.
- **Secrets and display flags.** These are never compared and are listed in `notVerifiedFields`: PSKs, DDNS passwords, WireGuard private keys, SSID `hidePwd`, and voucher code-generation inputs.

## Live controller evidence (2026-11-11)

**Environment.** Omada Software Controller with an ER605 v2.20 gateway and three EAP772/EAP653 APs. There is no Omada switch, and the WAN uses DHCP. The owner explicitly authorized testing on this production network, provided connectivity disruption stayed minimal.

**Isolation.** Each test object was created disabled, scoped to an unused domain or a TEST-NET range, or placed in an unassigned WLAN group or a switch-only VLAN. Objects were deleted afterwards. A final sweep found no leftovers. All devices stayed online, and critical clients (NAS, servers, Home Assistant, NVR, laptop) stayed connected throughout.

"Full lifecycle" below means the following sequence passed:

1. The preview showed the field differences.
2. Create was `verified`.
3. Update was `verified`.
4. A repeated update was a no-op with no write. The exception is resources with write-only fields, which always write.
5. Delete was `verified`.
6. The controller returned to its prior state.

| Family | Live result |
| --- | --- |
| LAN DNS rules, static routes, policy routes, port forwarding | Full lifecycle |
| Group profiles, URL filtering, MAC filtering, mDNS rules | Full lifecycle; the built-in group delete guard was confirmed |
| DDNS | Full lifecycle; the password is reported as not verified |
| LAN (switch port) profiles | Full lifecycle; the system profile delete guard was confirmed |
| WLAN groups, SSIDs | Group create, rename and delete were verified. An SSID mapped to a VLAN was created in an unassigned group, verified against its detail, and deleted. The primary group guard was confirmed. |
| LAN networks | A switch-only VLAN went through the full lifecycle; the primary network guard was confirmed |
| UPnP, SNMP, IDS/IPS, attack defense | Preview, plus a no-op apply verified without any write |
| ALG | Applied, verified and restored |
| `locateDevice`, `setClientName`, `setClientLockToAp` | Applied and verified (locate reports `submitted`). Lock-to-AP was tested on an IoT client using its current AP, then unlocked. |
| Voucher groups | Create verified and delete verified |
| One-to-one NAT | Correctly rejected (`-34282`): this controller requires a static-IP WAN |
| VPN update and delete | Unknown-ID guards only; this site has no VPNs |
| `forceProvisionDevice`, `startDeviceOnlineUpgrade`, `adoptDevice`, `recoverSwitchPortPoe`, hotspot authorize and unauthorize | Preview or preflight refusals only, to avoid disruption or because the hardware isn't present (no pending devices, no newer firmware, no switch, no portal) |

## Controller requirements found during validation

| Operation | Requirement |
| --- | --- |
| LAN DNS create and update | At least one `lanNetworkIds` entry |
| DDNS create and update | `interval` with exactly one of `updateInterval` or `customInterval`. Reads flatten it into top-level fields. |
| LAN profile update | `untagNetworkIds` must be present, even when empty |
| SSID create | `vlanId` when `vlanEnable` is true, and `pskSetting.securityKey` for WPA-Personal. SSID list rows are summaries, so verification uses `getSsidDetail`. |
| Voucher group create | `customRateLimit` for rate limit mode 0, or `rateLimitProfileId` for mode 1 |
| MAC filter reads | Entries are listed per allow or deny list without `filterMode`; the read layer restores it |
| Lock-to-AP reads | `aps` comes back as `{ name, mac }` objects |

The following pre-existing reads were fixed. They used the paginated reader on endpoints that return bare arrays, so they failed on real data:

- `listSiteToSiteVpns`
- `listGroupProfiles`

## Remaining limits

- Disposable-controller and adopted-switch evidence is still required before a stable release, as described in [the release plan](0.19-release-plan.md). Switch and VPN apply paths were not exercised on hardware.
- Verification confirms controller-observed configuration, not data-plane behavior.
