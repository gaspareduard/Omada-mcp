# Support and validation matrix

| Surface | 0.19.0-rc.1 evidence | Limit |
| --- | --- | --- |
| stdio / MCP catalog | Local SDK protocol and schema tests | Client host approval policies remain external |
| Request/auth/pagination | Unit and local HTTP contracts | Live controller/firmware behavior varies |
| Software controller 6.2.14.11 | Existing installation confirmed; candidate observations in validation record | Selected reads/previews only, not all operations |
| New radio/SSID/switch apply paths | Official tag specs and mocked contract tests | Disposable controller and adopted hardware tests pending |
| Networking write tools (unreleased) | Spec-checked routes, generated schemas, mocked contracts, and owner-authorized live lifecycle tests on an ER605 + EAP site ([record](operations/networking-writes-validation.md)) | No switch, VPN or static-WAN evidence; disposable-controller gate still applies |
| Other software/hardware controllers | Not newly validated by this candidate | Verify each operation before granting write access |
| HTTP transport | Loopback lab only | Not production supported |
| Private GUI APIs / OC200 fallback | Not implemented | `compatibility` is a deprecated profile alias |

Use official Open API routes only. Availability in the catalog is not proof of controller or firmware support. See [release validation](operations/0.19-validation.md) for observed results and [release readiness](operations/release-readiness-checklist.md) for promotion gates.
