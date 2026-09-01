# Beacon protocol notes

Beacon is a versioned collateral-admission registry. A validator classifies bounded evidence; the Intelligent Contract maps that passport to a fixed policy:

| Verdict | Maximum LTV |
| --- | ---: |
| CORE | 8000 bps |
| STANDARD | 6500 bps |
| WATCH | 2000 bps |
| REJECT | 0 bps |

Validators never submit an LTV value. Objective evidence is normalized independently from CoinGecko and CoinPaprika for USD-supported assets. Both sources must identify the submitted market identity and remain within 100 bps of one another. A material disagreement is `EVIDENCE_CONFLICT`; one available source is recorded and capped at WATCH; no available source fails closed.

Semantic evidence is assigned to the fixed roles ISSUER, REDEMPTION, BACKING, SECURITY and GOVERNANCE. URLs must be bounded HTTPS public-looking hostnames, are stored as untrusted evidence, and are never treated as instructions. Provenance is validator-classified as `FIRST_PARTY`, `INDEPENDENT` or `UNKNOWN`; the submitter cannot assert independence. Missing redemption or backing evidence, or insufficient independent critical provenance, prevents CORE.

Testnet V1 anti-spam economics are fixed non-refundable fees held by the protocol: `1 GEN` for `submit_asset` and `0.25 GEN` for `challenge_asset`. They are not deposits, rewards or slashing balances. This deliberately avoids relying on unsupported refund or transfer behavior during the first local release.

The write lifecycle is `SUBMITTED → EVALUATED → VERDICT`, with `CHALLENGED → REASSESS` creating a new passport version. Passport and challenge history is append-only from the application’s perspective. Evaluation failures remain distinct from business verdicts and fail closed to zero LTV.
