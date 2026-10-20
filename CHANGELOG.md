# Changelog

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
