# Beacon

Know what deserves to back leverage.

Beacon is a versioned collateral-risk registry for stablecoins and stable-value assets. It answers one practical question: should this asset be accepted as collateral, and under what deterministic maximum-LTV tier?

## Product

Beacon stores a bounded collateral passport for each submitted asset. GenLayer validators inspect objective market evidence and semantic issuer evidence independently; the contract turns the accepted result into a fixed collateral policy. Beacon is a risk-governance protocol, not a generic AI risk-score application.

## Problem

Collateral admission is often assembled manually from fragmented signals: peg stability, liquidity, redemption terms, reserve backing, governance controls, security history, and dependencies. The information changes, sources disagree, and a convenient summary can conceal uncertainty. Beacon makes the evidence bundle, validator outcome, safety caps, and version history inspectable.

## Why GenLayer

Validators independently inspect untrusted external evidence. Beacon reduces nondeterministic evidence into bounded policy fields and uses an Equivalence Principle design that compares stable, decision-critical results rather than raw prose, ordering, timestamps, or volatile intermediate values. Consensus determines whether the evaluation is accepted; the Intelligent Contract remains the policy authority. The accepted passport is persisted on-chain.

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

Semantic evidence is submitted by role: issuer, redemption, backing, security, and governance. Sources are HTTPS-constrained, bounded, independently refetched by validators, and always treated as untrusted evidence. Deterministic role-specific extraction bounds the material sent to one structured semantic LLM call. Prompt-injection-shaped content cannot change the rubric, schema, or operation. Validator errors fail closed.

The public contract surface is intentionally small:

- Writes: `submit_asset`, `evaluate_asset`, `challenge_asset`, `reassess_asset`
- Views: `asset`, `assets`, `asset_ids`, `asset_count`, `current_passport`, `passport_by_version`, `passport_history`, `challenge_records`

Passports are versioned and prior versions are immutable. Challenges target a specific passport version and reassessment creates a new version. Evaluation failures remain distinct from a normal business `REJECT`.

## Live Bradbury Proof

Canonical release proof is V4 on Testnet Bradbury:

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

The complete chronology, including failed historical attempts, is preserved in [`docs/live-proof/bradbury-pilot.json`](docs/live-proof/bradbury-pilot.json). The in-app [Public proof](/proof) route displays the same release identity alongside live V4 reads.

## Security / Trust Model

- Submitted URLs are untrusted input; validators refetch them independently.
- Evidence extraction and semantic output are bounded and schema-validated.
- Volatile intermediate fields are not consensus targets when they do not change policy.
- Validator, HTTP, parser, and LLM errors fail closed.
- A single objective source cannot exceed `WATCH`.
- Critical unknown semantic fields can force `REJECT` and `0` bps.
- Fees are fixed Testnet V1 anti-spam fees: `1 GEN` for registration and `0.25 GEN` for challenges. They remain protocol-held; they are not described as burned.

## Historical Engineering Evidence

V1 exposed an underlying-chain pubdata limit during deployment. V2 and V3 deployments and submissions succeeded, while evaluation attempts exposed excessive semantic fetch work, volatile turnover comparison, and overly strict semantic equivalence. V4 retains the proven objective and bounded-fetch design while using independent policy-field comparison with a complete validator exception boundary. These earlier versions remain historical evidence, not release contracts.

## Limitations

- The live V4 proof covers deploy → submit → evaluate → Passport.
- Challenge/reassessment is implemented and locally tested, but is not included in the final Bradbury release proof.
- Public testnet and validator availability can affect nondeterministic execution.
- Semantic quality depends on reachable, authoritative evidence sources.
- The application is currently a public read surface; wallet writes require a funded GenLayer account and exact precondition/finality reconciliation.

## Developer

Requirements: Python with the project dependencies, Node.js, and the GenLayer tooling used for local validation.

```bash
# Contract checks
python -m pytest -q
genvm-lint check contracts/beacon.py
genvm-lint validate contracts/beacon.py

# Frontend
cd app
npm ci
npm test
npm run typecheck
npm run build
```

The public application uses Testnet Bradbury (`chain ID 4221`, `https://rpc-bradbury.genlayer.com`) and the V4 contract above. Copy [`app/.env.example`](app/.env.example) to a local environment only when overriding the checked-in production defaults.
