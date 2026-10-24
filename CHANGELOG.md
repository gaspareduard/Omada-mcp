# Changelog

## 0.19.0-rc.1 - 2026-10-24

- default all writes to preview, separate explicit recovery permissions, and distinguish submitted changes from verified readback
- serialize request pacing, share token acquisition, bound read retries/pagination, reject malformed envelopes, recover site discovery and normalize client identity with ambiguity checks
- add typed AP radio, restricted SSID basic-setting and guarded switch-port workflows with bounded semantic verification and partial outcomes
- add enabled-operation search/schema discovery, optional compact dispatch, hidden legacy aliases and capability metadata
- add Wi-Fi, log and camera-client diagnostic composition with timestamps and incomplete-evidence reporting
- incorporate PR #10 by q759k6n9pm-hash; extend shared redaction, restrict optional tool headers, add private CA trust and disable redirects
- remove an unregistered duplicate device-stats implementation, verify README inventory against runtime registration, expand protocol/regression coverage and update compatible dependencies
- document migration, issue #11 registry findings and operation-specific validation; Zod has a remaining high advisory, and stable write-tool release awaits disposable-controller/hardware evidence

See [migration](docs/operations/0.19-migration.md) and [validation](docs/operations/0.19-validation.md). This candidate does not upgrade the live installation.

## 0.18.0 - 2026-10-20

- added site auto-discovery when neither a tool argument nor `OMADA_SITE_ID` supplies a site: single-site controllers are selected automatically; controllers with no sites or multiple sites return an explanatory error
- added `createSwitchAcl` and `updateSwitchAcl` tools with schema validation, dry-run previews, and existing-rule checks for updates
- expanded the default `safe-read` profile with firewall ACL and traffic read tools
- reorganized README tool tables into collapsible read and write sections
- configured repository engineering skills with GitHub Issues, default triage labels, and single-context domain documentation conventions
- updated CI and publishing actions to releases using the Node.js 24 runtime
- synchronized package and lockfile versions for the release

## 0.17.0 - 2026-04-05

- added explicit two-step `confirmDangerous` confirmation gate to all four restore tools (`restoreController`, `restoreControllerFromFileServer`, `restoreSites`, `restoreSitesFromFileServer`) — irreversibility warning surfaces before any execution
- fixed three API contract bugs: `getRogueApExport` format values corrected to spec (`'0'`/`'1'`), threat API timestamps converted to seconds, `getThreatList` site scoping via `siteList` param
- expanded `ops-write` capability profile to include `maintenance:rw`, `logs:r`, `network-wan:r`, `security-threat:r`, `vpn:r`
- documented `confirmDangerous` scope and limitations in `CLAUDE.md` and `README.md`
- added `AGENTS.md` symlink to `CLAUDE.md` for cross-agent instruction pickup
- fixed Docker publish workflow to use dynamic repository owner

## 0.16.0 - 2026-04-03

- promoted the hardened Omada MCP platform to a stdio-first production baseline
- completed Phase 3 administrative tooling for AP, gateway, DHCP, ACL, and traffic-control workflows
- aligned server version reporting with package metadata
- tightened legacy HTTP mode so it remains loopback-only even when explicitly enabled for lab use
- refreshed README, Docker README, and AI-agent instructions to match the current platform behavior
- strengthened CI with symlink validation and cleaned release metadata for the published package and container image
