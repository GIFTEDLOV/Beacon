# Beacon V2 consensus notes

Beacon V2 keeps the public contract surface and storage model of V1. The V2
change is limited to making nondeterministic evidence handling bounded and
consensus-robust.

| Field | Source | Validation pattern | Tolerance / rule | Consensus-critical |
| --- | --- | --- | --- | --- |
| price and peg deviation | CoinGecko + CoinPaprika | Numeric tolerance | normalized micro-units; source agreement within 100 bps | Yes |
| liquidity turnover | CoinGecko + CoinPaprika | Partial field matching | normalized risk band; raw volume/timestamps are not compared | Yes |
| source coverage | Objective source bundle | Partial field matching | `BOTH`, `PRIMARY_ONLY`, `SECONDARY_ONLY`, or `NONE` | Yes |
| source conflict | Objective source bundle | Partial field matching | material disagreement is `EVIDENCE_CONFLICT` | Yes |
| freshness and identity | Objective source parsers | Source-grounded deterministic checks | each source validates its own identity/timestamp shape | Yes |
| redemption risk/status | Role-reduced redemption evidence | Source-grounded validation | validator checks whether the bounded leader claim is supported | Yes |
| backing risk/type | Role-reduced backing evidence | Source-grounded validation | worse or unsupported claims are rejected | Yes |
| admin/governance risk | Role-reduced governance evidence | Source-grounded validation | bounded enum only | Yes |
| security risk/incident | Role-reduced security evidence | Source-grounded validation | active critical incident cannot be made safer by consensus | Yes |
| dependency risk | Role-reduced evidence across fixed roles | Source-grounded validation | bounded enum only | Yes |
| provenance | Fixed role evidence | Source-grounded validation | URLs do not self-declare independence; `UNKNOWN` is conservative | Yes |
| confidence and unknown count | Normalized semantic result | Deterministic derivation | derived from sufficiency and bounded risk fields | Yes |
| reasoning, ordering, prose, raw timestamps | External/LLM output | Not compared | never part of the semantic output schema | No |
| verdict and maximum LTV | Contract policy engine | Deterministic exact mapping | `CORE=8000`, `STANDARD=6500`, `WATCH=2000`, `REJECT=0` | Yes |

The leader emits only the bounded semantic claim schema. The validator
independently fetches the same fixed-role evidence and returns only
`{"supported": true}` or `{"supported": false}`. It does not reproduce the
leader's prose or compare full response dictionaries. Any validator exception,
fetch failure, malformed JSON, invalid enum, missing field, or unsafe claim is
handled as non-support and therefore cannot authorize a favorable claim.

Both objective endpoints remain independent and are normalized separately. The
compact CoinGecko endpoint is used instead of the large coin-detail response;
semantic pages are rendered as text, whitespace-normalized, role-windowed, and
hard-capped before they reach the LLM. Evidence remains untrusted data: it
cannot alter the rubric, schema, operation, verdict, or LTV policy.

V1's `UNDETERMINED` evaluation is preserved in the live-proof artifact as
historical evidence. It is not retried or rewritten by V2.
