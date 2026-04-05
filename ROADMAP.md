# Omada MCP — Development Roadmap

> Current version: **v0.16.0** · ~300 / 1648 operations implemented (18.2%)

---

## Current State

| Metric | Value |
|---|---|
| Operations implemented | ~300 / 1648 (18.2%) |
| Complete categories | `client-insights`, `maintenance` |
| Composite tools | 4 — `getNetworkHealthSummary`, `getGatewayHealth`, `diagnoseClient`, `getSecurityOverview` |
| Production transport | stdio |
| Launch infrastructure | ✅ CI/CD, npm hygiene, community files, Docker publish all done |

---

## Immediate — Pre-v1.0.0

Ordered by priority:

| # | Task | Effort | Why |
|---|---|---|---|
| 1 | **Fix `ops-write` profile scope** | hours | `maintenance:rw`, `logs:r`, `network-wan:r`, `security-threat:r`, `vpn:r` are missing — backup/restore tools are currently locked behind `admin` only |
| 2 | **`schedules` (0/7)** | 1–2 days | Easiest complete category — port schedules + time-range profiles unlock automation workflows |
| 3 | **`getApHealth` + `getSwitchHealth` composite tools** | 1 day | Follows `getGatewayHealth` pattern — single-call health snapshot for AP and switch devices |
| 4 | **`account-users` (0/19)** | 2–3 days | User/role CRUD — needed for multi-user and MSP setups |
| 5 | **`devices-general` writes** | 3–4 days | Reboot, locate, firmware upgrade, device adoption — biggest operational value gap |
| 6 | **VPN user management gap** | 2 days | SSL VPN users/groups/resources and WireGuard peer management missing |

### v1.0.0 Release Criteria

- Items 1–6 above complete
- Coverage ≥ 35% (~580+ operations)
- `account-users` fully implemented
- `schedules` fully implemented (7/7)
- Composite tools for gateway ✅, AP, and switch
- `ops-write` profile correctly scoped
- npm published + Docker image on GHCR (multi-arch amd64 + arm64)
- Zero known security issues
- Integration tests running against Docker Omada controller

---

## Near-Future — v1.1 to v1.3

- **`profiles`** (12/154) — app control rules, IoT settings, OSPF/VRRP profiles
- **`hotspot-portal`** (0/33) + **`hotspot-vouchers`** (0/20) — guest network management
- **`network-wan` gap** (10/22) — multi-WAN failover and load balancing writes
- **`firewall-ids`** (3/13) — complete IDS/IPS rule management surface
- **Additional composite tools** — VPN Status Overview, Site Infrastructure Summary, Wireless Performance snapshot

---

## Medium-Term — v1.x

- **MCP Resources API** — expose network topology snapshots, firmware catalogs, and threat intelligence as MCP resources rather than tool calls. Skeleton already exists in `src/server/common.ts`.
- **MCP Subscriptions** — real-time push for threat alerts, device status changes, and client connection events.

---

## Long-Term — v2.0

- **HTTP transport promotion** — currently lab-only (dual opt-in flags, loopback-only). Production promotion requires bearer token auth, TLS enforcement, and rate limiting. Infrastructure exists in `src/server/http.ts` and `src/server/stream.ts`.
- **OpenAPI-driven code generation** — at ~300 tools, manual implementation is viable. Scaling to 1648 needs a generator that produces operation class stubs, tool files, and test skeletons directly from `docs/openapi/*.json`.
- **`site-templates`** (0/359) + **`msp`** (0/118) — large surfaces for template-based and MSP workflows.

---

## Coverage Snapshot

| Category | Implemented | Total | % |
|---|---:|---:|---:|
| client-insights | 5 | 5 | 100% |
| maintenance | 14 | 14 | 100% |
| wireless-radio | 15 | 20 | 75% |
| network-services | 26 | 32 | 81% |
| vpn | 27 | 77 | 35% |
| devices-switch | 16 | 38 | 42% |
| devices-ap | 16 | 59 | 27% |
| devices-general | 11 | 117 | 9% |
| profiles | 12 | 154 | 7% |
| schedules | 0 | 7 | 0% |
| account-users | 0 | 19 | 0% |
| hotspot-portal | 0 | 33 | 0% |
| site-templates | 0 | 359 | 0% |
| **Total** | **~300** | **1648** | **18%** |

> Full backlog with all 1648 operations: see [`OMADA_TOOLS.md`](./OMADA_TOOLS.md)
