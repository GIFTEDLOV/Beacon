# Beacon

Know what deserves to back leverage.

Beacon is a versioned collateral-risk registry for stablecoins and stable-value assets. It answers one practical question: should this asset be accepted as collateral, and under what deterministic maximum-LTV tier?

## Current submission status

Beacon's latest source candidate is complete and locally validated, but the exact final source has not been successfully redeployed on Testnet Bradbury. This README intentionally does not claim a final V7 contract address or a finalized V7 Passport v2.

- Repository branch: `v6-reassessment-hardening`
- Current branch head before this README update: `50f978c2cee14bbd8f568e9705eb383da0fe596d`
- Final source-fix commit: `2a4629bac65616300b205378e234838ef717d71d`
- Final `contracts/beacon_v7.py` SHA-256: `45ac294a11321200ace5e3d26798da7f00646ccb4e04bf6c6616ffb38a619468`
- Public app: https://beacon-rho-brown.vercel.app
- Current public production remains pinned to historical V6 evidence; the final V7 candidate was not promoted.
- Latest recorded local gates: `173` Python tests passed, `23` frontend tests passed, GenVM lint passed, GenVM validation passed, frontend build passed, security audit passed, and secret scan passed.

The remaining release gap is live Bradbury execution. Multiple same-intent outer-EVM deployment attempts for the final source were accepted by RPC/mempool surfaces but never produced an underlying-chain receipt. No `NewTransaction` event was emitted, no GenLayer protocol transaction ID was created, and no final V7 contract state change occurred. The authoritative mined nonce remained unchanged while RPC pending-state visibility oscillated. The repository preserves the reconciliation and root-cause evidence under [`docs/reviewer-remediation-2026-09/final-submission/`](docs/reviewer-remediation-2026-09/final-submission/).

## Reviewer remediation summary

The latest source addresses the two steward concerns at the contract-design level.

### 1. Authenticated asset and semantic-source binding

V7 treats the canonical chain namespace plus normalized token address as the root asset identity. CoinGecko and CoinPaprika provider IDs are independently verified against that exact address before market data is accepted. Same-symbol assets remain distinct by address, and a wrong address cannot borrow another token's provider identity.

Semantic authority is chained to that authenticated identity. The issuer source is the exact-address semantic anchor; the other Circle role sources prove their role and unambiguous USDC relevance against the already authenticated canonical asset. Validators compare stable, decision-bearing claims rather than rendering-sensitive page windows or exact live-response digests.

### 2. Every open challenge is evaluated independently

Every OPEN challenge targeting the current Passport version is processed individually from its category, reason, authenticated stored evidence, and canonical asset identity. Challenge evidence is authenticated and bounded at creation time. Reassessment does not refetch challenge pages, and challenge outcomes are stored independently as `SUPPORTED`, `NOT_SUPPORTED`, or `INSUFFICIENT_EVIDENCE` with a reason code, evidence digest, and resolution version.

The Passport records deterministic challenge-set provenance. A failed reassessment is atomic: it creates no new Passport and does not partially resolve challenges. Supported findings can only make the policy more conservative; unsupported or insufficient challenges cannot improve the collateral tier.

The source and deterministic tests cover multi-challenge reassessment, including two simultaneous open challenges. A successful final live V7 two-challenge Bradbury reassessment was not completed, so no Passport v2 is claimed for this final source.

## Product

Beacon stores a bounded collateral passport for each submitted asset. GenLayer validators inspect objective market evidence and semantic issuer evidence independently; the contract turns the accepted result into a fixed collateral policy. Beacon is a risk-governance protocol, not a generic AI risk-score application.

## Problem

Collateral admission is often assembled manually from fragmented signals: peg stability, liquidity, redemption terms, reserve backing, governance controls, security history, and dependencies. The information changes, sources disagree, and a convenient summary can conceal uncertainty. Beacon makes the evidence bundle, validator outcome, safety caps, and version history inspectable.

## Why GenLayer

Validators independently inspect untrusted external evidence. Beacon reduces nondeterministic evidence into bounded policy fields and uses an Equivalence Principle design that compares stable, decision-critical results rather than raw prose, ordering, timestamps, or volatile intermediate values. Consensus determines whether the evaluation is accepted; the Intelligent Contract remains the policy authority. Accepted passports are persisted on-chain and versioned.

## How Beacon works

```text
SUBMIT
  -> VERIFY COINGECKO IDENTITY
  -> VERIFY COINPAPRIKA IDENTITY
  -> CHECKPOINT ISSUER / REDEMPTION / BACKING / SECURITY / GOVERNANCE
  -> CHECKPOINT COINGECKO / COINPAPRIKA MARKET DATA
  -> EVALUATE STORED FACTS
  -> COLLATERAL PASSPORT
  -> CHALLENGE(S)
  -> REASSESS ALL OPEN CHALLENGES
  -> NEW PASSPORT VERSION
```

The policy map is fixed:

- `CORE` -> `8000` max-LTV basis points
- `STANDARD` -> `6500` max-LTV basis points
- `WATCH` -> `2000` max-LTV basis points
- `REJECT` -> `0` max-LTV basis points

Validators never choose an LTV directly. Deterministic safety rules can cap or reject a result when evidence is conflicted, unavailable, severely unstable, or critically unknown.

## Architecture

External evidence is checkpointed into small consensus writes. CoinGecko and CoinPaprika identity checkpoints, one semantic-source checkpoint per role, and one market snapshot per provider independently authenticate and persist bounded facts. `evaluate_asset` performs zero web fetches and evaluates the stored checkpoint state with one bounded structured semantic judgment. Stale or incomplete checkpoints fail closed.

Official Circle Markdown sources are used for the five semantic roles:

- Issuer: `https://developers.circle.com/stablecoins/usdc-contract-addresses.md`
- Redemption: `https://developers.circle.com/circle-mint/concepts/how-minting-works.md`
- Backing: `https://developers.circle.com/stablecoins/what-is-usdc.md`
- Security: `https://developers.circle.com/cctp/references/technical-guide.md`
- Governance: `https://developers.circle.com/xreserve/concepts/usdc-backed-stablecoin-specification.md`

The public contract surface is intentionally small.

Writes:

- `submit_asset`
- `verify_coingecko_identity`
- `verify_coinpaprika_identity`
- `verify_semantic_source`
- `refresh_coingecko_market`
- `refresh_coinpaprika_market`
- `evaluate_asset`
- `challenge_asset`
- `reassess_asset`

Views include asset records, asset IDs, current and historical passports, and challenge records.

## Security and trust model

- Submitted URLs are untrusted input; validators independently retrieve permitted evidence.
- HTTPS syntax alone is not treated as publisher authentication.
- Asset identity is rooted in chain namespace plus token address.
- Provider IDs must bind back to the exact canonical asset before market data is accepted.
- The issuer source provides the direct exact-address semantic anchor.
- Other semantic roles inherit the authenticated canonical-asset anchor and must still satisfy role-specific authority and binding checks.
- Rendering-dependent excerpts and exact live-response digests are not decision-bearing consensus targets.
- Validator, HTTP, parser, and semantic-output failures fail closed.
- One available objective source cannot exceed `WATCH`.
- Critical unknown semantic fields can force `REJECT` and `0` bps.
- Challenge evidence is bounded before storage and is not refetched during reassessment.
- Fees are fixed testnet anti-spam values: `1 GEN` for registration and `0.25 GEN` per challenge. The project does not describe these values as burned.

## Historical Bradbury evidence

### V4

V4 remains immutable historical proof on Testnet Bradbury:

- Contract: `0xaA0EEB41C30C54104F4106E06acCF4395Ec96b54`
- Source SHA-256: `5f99961a335247b4b108cdb7a575d356242461fbec411fd10c207018331a809d`
- Deployment transaction: `0xc5dacaf4e67b4cb8fec89d6d13677f4bedf636ab7a65cd05290262b3b16cb1a4`
- Submit transaction: `0x2f70c0b99e9aa3cd3e5edc32359de406e893cc6e5374e4043082b3492414dc47`
- Evaluate transaction: `0x38d46549976fa719b717dcfb43d8584fe26b1d722639be7c04a66221307270e7`
- Evaluation reached `FINALIZED` with `FINISHED_WITH_RETURN`.
- Passport version `1`: `REJECT`, `0` bps, policy basis `MULTIPLE_CRITICAL_UNKNOWN_FIELDS`.

The full V4 chronology is preserved in [`docs/live-proof/bradbury-pilot.json`](docs/live-proof/bradbury-pilot.json).

### V5

The final V5 source was deployed to `0xd52daA517259ca08dF2f4839C0d8962E0A3148c8`. Canonical Ethereum USDC was submitted and identity resolution agreed, but the one authorized V5 evaluation ended `UNDETERMINED`; no Passport was created and no retry was sent. The complete record is preserved in [`docs/live-proof/beacon-v5.json`](docs/live-proof/beacon-v5.json).

### V6 reviewer-remediation proof

Historical V6 deployment:

`0xE3706dc54B2Ca0a33941753Bc214f95670Fee7Fb`

V6 provided important live proof for exact-address identity binding, including a canonical Ethereum USDC positive case and a wrong-address negative case. Its attempted live multi-challenge reassessment ended `UNDETERMINED`, so it is not presented as a successful Passport v2 proof. The V6 receipts, state readbacks, and reviewer evidence are indexed in [`docs/reviewer-remediation-2026-09/README.md`](docs/reviewer-remediation-2026-09/README.md).

### V7 final candidate

The current final candidate is [`contracts/beacon_v7.py`](contracts/beacon_v7.py), source SHA-256:

`45ac294a11321200ace5e3d26798da7f00646ccb4e04bf6c6616ffb38a619468`

This candidate incorporates checkpointed external evidence, stable semantic equivalence, exact-address issuer anchoring, and bounded stored challenge evidence. It passed the recorded local gates. It does **not** have a final Bradbury deployment address because the final outer-EVM deployment attempts never produced a chain receipt or GenLayer protocol transaction.

## Current limitation

The final gap is operational, not hidden: there is no successfully finalized Bradbury deployment for the exact V7 source above, and therefore no final live V7 Passport v1/v2 proof. The project preserves this fact instead of substituting an older contract address or claiming an unmined deployment.

Public testnet, RPC, mempool, validator, and external-source availability can affect live nondeterministic execution. Historical deployments remain evidence of prior iterations and are not represented as the current V7 release.

## Reviewer evidence

Reviewer-remediation materials are under:

[`docs/reviewer-remediation-2026-09/`](docs/reviewer-remediation-2026-09/)

The latest final-submission working evidence is under:

[`docs/reviewer-remediation-2026-09/final-submission/`](docs/reviewer-remediation-2026-09/final-submission/)

This includes source-fix evidence, root-cause analysis, and chain-write reconciliation records. Historical failed attempts are intentionally preserved.

## Developer

Requirements: Python with project dependencies, Node.js, and the GenLayer tooling used for local validation.

```bash
# Contract checks
python -m pytest -q
genvm-lint check contracts/beacon_v7.py
genvm-lint validate contracts/beacon_v7.py

# Frontend
cd app
npm ci
npm test
npm run typecheck
npm run build
```

The public application uses Testnet Bradbury (`chain ID 4221`, `https://rpc-bradbury.genlayer.com`) and remains pinned to historical V6 release evidence. The final V7 candidate has not been deployed or bound to production.
