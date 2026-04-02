# Support Matrix

| Target | Status | Notes |
| --- | --- | --- |
| Hosted / software controller | Supported baseline | Primary target for milestone 1 |
| Hardware controller | Partial | Validate endpoint parity before enabling broader admin tools |
| OC200 compatibility fallback | Planned, separate track | Not part of the mainline runtime; document and gate separately |

## Constraints

- Use the official Open API where available.
- If a feature is missing from the Open API on a specific controller family, treat it as a compatibility gap instead of broadening the mainline trust model.
