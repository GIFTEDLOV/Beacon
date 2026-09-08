# Beacon

Know what deserves to back leverage.

Beacon is a versioned collateral-risk registry for stablecoins and stable-value assets. It answers one practical question: should this asset be accepted as collateral, and under what deterministic maximum-LTV tier?

## Current release story

- V4 is historical Bradbury proof.
- V5 is historical remediation work and is not the current live contract.
- V6 is the prior reviewer-remediation deployment at
  `0xE3706dc54B2Ca0a33941753Bc214f95670Fee7Fb`; its live evidence is preserved
  as historical provenance, including the reassessment outcome `UNDETERMINED`.
- V7 is the current security-hardened candidate in
  [`contracts/beacon_v7.py`](contracts/beacon_v7.py). It is not deployed and has
  no address yet.

## Product

Beacon stores a bounded collateral passport for each submitted asset. GenLayer validators inspect objective market evidence and semantic issuer evidence independently; the contract turns the accepted result into a fixed collateral policy. Beacon is a risk-governance protocol, not a generic AI risk-score application.

## Problem

Collateral admission is often assembled manually from fragmented signals: peg stability, liquidity, redemption terms, reserve backing, governance controls, security history, and dependencies. The information changes, sources disagree, and a convenient summary can conceal uncertainty. Beacon makes the evidence bundle, validator outcome, safety caps, and version history inspectable.

## Why GenLayer

Validators independently inspect untrusted external evidence. Beacon reduces nondeterministic evidence into bounded policy fields and uses an Equivalence Principle design that compares stable, decision-critical results rather than raw prose, ordering, timestamps, or volatile intermediate values. Consensus determines whether the evaluation is accepted; the Intelligent Contract remains the policy authority. The accepted passport is persisted on-chain.

## Asset Identity and Source Authentication

V7 treats the canonical chain namespace plus normalized token address as the
root identity. Provider IDs are derived or independently verified through
address-bound CoinGecko and CoinPaprika endpoints; they are never trusted merely
because a submitter asserted them. Market data cannot be borrowed from another
token, and same-symbol assets remain distinct by address.

Semantic authority is tied to the verified issuer domain and the exact verified
chain/address/token identity. A valid HTTPS URL is only transport syntax. An
unknown or conflicting provider identity, unrelated source domain, phishing
domain, or source page for another asset fails closed before positive semantic
evidence can affect the policy. The current candidate chain model supports
`eip155:1` (Ethereum mainnet) with explicit aliases only.

## Challenge Reassessment

Every open challenge targeting the current Passport version is individually
evaluated. V7 authenticates and bounds challenge evidence during challenge
creation, persists only the consensus-validated bounded representation, and
never refetches challenge pages during reassessment. Category, reason, bounded
evidence, and the authenticated asset identity are all inputs. Results are
recorded per challenge as `SUPPORTED`, `NOT_SUPPORTED`, or
`INSUFFICIENT_EVIDENCE`, with a reason code, evidence digest, and resolution
version.

The Passport records deterministic challenge-set provenance without storing an
unbounded array. A failed reassessment creates no new Passport and changes no
challenge status. Unsupported or insufficient challenges do not improve risk;
supported findings can only make the policy more conservative.

## How Beacon Works

```text
SUBMIT → OBJECTIVE EVIDENCE → SEMANTIC EVIDENCE → VALIDATOR CONSENSUS
        → DETERMINISTIC POLICY → COLLATERAL PASSPORT
```

The policy map is fixed:

- `CORE` → `8000` max-LTV basis points
- `STANDARD` → `6500` max-LTV basis points
- `WATCH` → `2000` max-LTV basis points
- `REJECT` → `0` max-LTV basis points

Validators never choose an LTV directly. Deterministic safety rules can cap or reject a result when evidence is conflicted, unavailable, severely unstable, or critically unknown.

## Architecture

Objective evidence uses independent CoinGecko and CoinPaprika market feeds. Beacon normalizes each response into small fields, uses bounded numeric tolerance for changing price facts, and treats source conflict as fail-closed. One available objective source cannot exceed `WATCH`.

Semantic evidence is submitted by role: issuer, redemption, backing, security, and governance. Sources are HTTPS-constrained, bounded, independently refetched by validators, and always treated as untrusted evidence. Deterministic role-specific extraction bounds the material sent to one structured semantic LLM call. Prompt-injection-shaped content cannot change the rubric, schema, or operation. Validator errors fail closed. V7 challenge evidence is authenticated once at creation, reduced to at most 2,800 UTF-8 bytes, and consumed from storage during reassessment.

The public contract surface is intentionally small:

- Writes: `submit_asset`, `evaluate_asset`, `challenge_asset`, `reassess_asset`
- Views: `asset`, `assets`, `asset_ids`, `asset_count`, `current_passport`, `passport_by_version`, `passport_history`, `challenge_records`

Passports are versioned and prior versions are immutable. Challenges target a specific passport version and reassessment creates a new version. Evaluation failures remain distinct from a normal business `REJECT`.

## Historical V4 Bradbury Proof

V4 remains immutable historical proof on Testnet Bradbury. It is not the V5
contract and it is not evidence that V4 had the V5 identity or challenge
protections:

- Public app: https://beacon-rho-brown.vercel.app
- Contract: `0xaA0EEB41C30C54104F4106E06acCF4395Ec96b54`
- Source SHA-256: `5f99961a335247b4b108cdb7a575d356242461fbec411fd10c207018331a809d`
- Deployment transaction: `0xc5dacaf4e67b4cb8fec89d6d13677f4bedf636ab7a65cd05290262b3b16cb1a4`
- Submit transaction: `0x2f70c0b99e9aa3cd3e5edc32359de406e893cc6e5374e4043082b3492414dc47`
- Evaluate transaction: `0x38d46549976fa719b717dcfb43d8584fe26b1d722639be7c04a66221307270e7`
- Evaluation: `FINALIZED`, `FINISHED_WITH_RETURN`, overall `AGREE`
- Validator receipts: `4 AGREE / 1 DETERMINISTIC_VIOLATION`
- Passport: version `1`, verdict `REJECT`, `0` bps
- Policy basis: `MULTIPLE_CRITICAL_UNKNOWN_FIELDS`

`REJECT` is a valid fail-closed business outcome. The live result was not manipulated into a favorable USDC result, and the evaluation receipt was not unanimous.

The complete V4 chronology, including failed historical attempts, is preserved
in [`docs/live-proof/bradbury-pilot.json`](docs/live-proof/bradbury-pilot.json).

## Historical V5 Remediation Proof

The V5 source was frozen at SHA-256
`b5077515361badc7c04d792d3f61c331f5d9b1c21edcd7cbc27e4576f80fc3e0` and
`52,329` bytes. The final frozen V5 source was deployed to
`0xd52daA517259ca08dF2f4839C0d8962E0A3148c8` by transaction
`0xd96311f0072722af9cfa71e2c1552722bfacb55d19ef58ee7cbf685fd72ec204`.
The deployment finalized with `FINISHED_WITH_RETURN` and `AGREE`; the deployed
source payload matched the frozen local source byte-for-byte and by hash.
Earlier pre-freeze V5 candidate deployments are unreleased, are not referenced
by the application, and are not included in this final candidate's proof.

Canonical Ethereum USDC was submitted once using the address-rooted asset ID
`eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` in transaction
`0xecee1abd2cf6b4d29fdf97384737a36811901b2c8642e01b2387eb7c096aa376`.
Submission finalized with `FINISHED_WITH_RETURN` and `AGREE`. The agreed
identity-stage output derived CoinGecko `usd-coin`, CoinPaprika
`usdc-usd-coin`, and Circle authority for the exact address.

The one authorized V5 evaluation was transaction
`0xca4f1e7d1cc63231dcbe64d8525843f7602004184335aa2f23ffe14796829e7e`. It
finished execution but reached `UNDETERMINED` / `DISAGREE` with
`3 TIMEOUT / 14 DETERMINISTIC_VIOLATION` validator outcomes. The asset remained
`SUBMITTED`, no Passport was created, and no retry was sent. Accordingly, V5
was not bound to production, and no live challenge was sent without a current
Passport. The complete record is in
[`docs/live-proof/beacon-v5.json`](docs/live-proof/beacon-v5.json); deterministic
multi-challenge proof is in [`test/test_beacon_v5.py`](test/test_beacon_v5.py).

The V5 record remains historical provenance. The V6 reviewer-remediation record
and its receipts are indexed in
[`docs/reviewer-remediation-2026-09/README.md`](docs/reviewer-remediation-2026-09/README.md).
The public proof surface still exposes historical V6 evidence; it does not
claim a V7 deployment or finalized V7 reassessment.

## Security / Trust Model

- Submitted URLs are untrusted input; validators refetch them independently.
- Evidence extraction and semantic output are bounded and schema-validated.
- Volatile intermediate fields are not consensus targets when they do not change policy.
- Validator, HTTP, parser, and LLM errors fail closed.
- V7 rejects missing final response hosts, URL authority confusion, trailing-dot
  ambiguity, userinfo, explicit ports, and literal IP hosts. DNS resolution and
  private-egress enforcement remain platform responsibilities because the
  pinned GenLayer contract runtime exposes no DNS-resolution API.
- A single objective source cannot exceed `WATCH`.
- Critical unknown semantic fields can force `REJECT` and `0` bps.
- Fees are fixed Testnet V1 anti-spam fees: `1 GEN` for registration and `0.25 GEN` for challenges. They remain protocol-held; they are not described as burned.

## Historical Engineering Evidence

V1 exposed an underlying-chain pubdata limit during deployment. V2 and V3 deployments and submissions succeeded, while evaluation attempts exposed excessive semantic fetch work, volatile turnover comparison, and overly strict semantic equivalence. V4 retains the proven objective and bounded-fetch design while using independent policy-field comparison with a complete validator exception boundary. These earlier versions remain historical evidence, not release contracts.

## Changes After Steward Review

V4 accepted independently supplied chain, token address, market IDs, symbols,
and semantic URLs without proving that the values described the same asset.
V4 also selected only the first open challenge's evidence, omitted that
challenge's category and reason from evaluation, and resolved every open
challenge anyway. These are confirmed historical defects, not V4 protections.
V5 added address-bound provider resolution, authenticated semantic-source rules,
fail-closed identity consensus, category-aware individual challenge
adjudication, and atomic all-challenge reassessment. V7 adds creation-time
challenge evidence authentication and hard bounds so an OPEN challenge cannot
later force reassessment to ingest an arbitrary web page.

## Limitations

- V4, V5, and V6 are historical release evidence; V7 is not deployed.
- The V6 live reassessment ended `UNDETERMINED`; it is not a finalized Passport v2 proof.
- V7 still requires Studio/devnet proof after this local security gate; no V7 address is claimed here.
- Public testnet and validator availability can affect nondeterministic execution.
- Semantic quality depends on reachable, authoritative evidence sources.
- The application is currently a public read surface; wallet writes require a funded GenLayer account and exact precondition/finality reconciliation.

## Developer

Requirements: Python with the project dependencies, Node.js, and the GenLayer tooling used for local validation.

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

The public application currently uses Testnet Bradbury (`chain ID 4221`,
`https://rpc-bradbury.genlayer.com`) and the historical V6 contract above.
V7 is a local security-hardened candidate only; it has not been deployed or
bound to production.
Copy [`app/.env.example`](app/.env.example) to a local environment only when
overriding the checked-in defaults.
