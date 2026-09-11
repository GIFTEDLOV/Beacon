# Beacon V8

Beacon is a versioned collateral-risk registry for stablecoins and other
stable-value assets. It turns authenticated identity, bounded semantic
evidence, and objective market checkpoints into a deterministic Passport and
maximum-LTV policy.

## Release status

V8 is implemented and locally validated on branch `v8-lean-final`. It is not
yet frozen or deployed: the installed GenLayer testing package does not expose
the required v0.6 fee-profile generation command, so Studio-dev and Bradbury
writes are intentionally pending. Production and GitHub were not changed.

- Public app: https://beacon-rho-brown.vercel.app
- Intended network: GenLayer Bradbury, chain ID `4221`
- V8 source: [`contracts/beacon_v8.py`](contracts/beacon_v8.py)
- V8 source bytes: `41,739` at this checkpoint
- V8 source SHA-256: `9136805f290a585bc4b5f752c0c79a9c6efbd14fce97ed366526bd1a423e1c18`
- V8 deployment entry point: [`deploy/v8/deploy.ts`](deploy/v8/deploy.ts)
- V8 freeze artifacts: not created until the fee-profile and Studio-dev gates pass

The current public site is historical V6 evidence. It must not be presented as
the V8 release until a V8 address and finalized lifecycle proof exist.

## Trust invariant

An asset is identified by canonical namespace plus exact token address. Provider
IDs are authenticated claims, not identity. CoinGecko and CoinPaprika must both
bind their claimed IDs to the exact address and chain/platform before Beacon
accepts identity or evaluates semantics.

For Ethereum USDC:

`eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`

The ISSUER source is the exact-address authority anchor. The other four
authoritative Circle sources inherit that authenticated canonical identity and
independently establish their role-specific authority and relevance; they are
not incorrectly required to repeat the address.

## Architecture

V8 stores small immutable checkpoints for provider identity, each of five
semantic roles, and each market source. Passport records retain decision
material and challenge-set provenance, while detailed evidence remains in its
checkpoint record. Semantic outputs are narrow closed schemas. Consensus uses
normalized consequential facts rather than raw HTML, Markdown, JSON ordering,
or volatile page content.

`evaluate_asset` performs no web fetch and no LLM call. It deterministically
combines verified identity, ISSUER/REDEMPTION/BACKING/SECURITY/GOVERNANCE
checkpoints, and CoinGecko/CoinPaprika market checkpoints into `CORE`,
`STANDARD`, `WATCH`, or `REJECT`.

Challenges authenticate bounded evidence once at creation. Reassessment reads
every OPEN challenge targeting the current Passport version, evaluates each
independently from stored evidence, performs zero evidence refetches, creates
the next Passport, then resolves every evaluated challenge atomically.

Reference lessons and the complete V8 evidence package are in:

- [`docs/v8/`](docs/v8/)
- [`docs/v8-final/`](docs/v8-final/)

Historical remediation records remain in
[`docs/reviewer-remediation-2026-09/`](docs/reviewer-remediation-2026-09/).

## Contract interface

Writes:

`submit_asset`, `verify_coingecko_identity`, `verify_coinpaprika_identity`,
`verify_semantic_source`, `refresh_coingecko_market`,
`refresh_coinpaprika_market`, `evaluate_asset`, `challenge_asset`, and
`reassess_asset`.

Reads:

`asset`, `assets`, `asset_ids`, `asset_count`, `checkpoint_state`,
`current_passport`, `passport_by_version`, `passport_history`, and
`challenge_records`.

## Transaction and finality model

The frontend has one V8 contract adapter, an account-free read client, and a
wallet/provider-backed write client. Every write estimates fees, broadcasts
once, persists the returned transaction ID immediately, and resumes the same
ID when tracking is interrupted. `ACCEPTED` is not `FINALIZED`; application
success requires `FINALIZED` and `FINISHED_WITH_RETURN`. Finalized contract
state is the only application state shown after a successful action.

## Local verification

The current local results are recorded in
[`docs/v8-final/TEST_MATRIX.md`](docs/v8-final/TEST_MATRIX.md):

- GenVM lint, validation, schema generation, and strict typecheck: PASS
- direct V8 contract tests: 14 passed
- frontend tests: 23 passed
- frontend typecheck and build: PASS
- source size: 41,739 bytes, below the 45,000-byte release target

The direct tests include the wrong-address genuine-USDC-ID negative proof,
provider disagreement, semantic authority checks, normalized witness
equivalence, market failure handling, two-challenge reassessment, zero
refetches, and atomic rollback.

## Reviewer quick start

Read [`docs/v8-final/REVIEWER_RESPONSE.md`](docs/v8-final/REVIEWER_RESPONSE.md)
for direct answers to the two reviewer concerns. The exact wrong-address test
uses:

`eip155:1:0x2222222222222222222222222222222222222222`

with the genuine `usd-coin` and `usdc-usd-coin` IDs and must fail closed.

Use [`deploy/v8/README.md`](deploy/v8/README.md) for the guarded V8 deployment
path. Do not use the historical [`deploy/deployScript.ts`](deploy/deployScript.ts),
which still names the V5 source.

## Development

```powershell
# Contract gates
$env:PYTHONPATH = 'C:\Users\DELL\.beacon-v8-references\genlayer-testing-suite-current'
python -m pytest -q test/test_beacon_v8.py
genvm-lint check contracts/beacon_v8.py
genvm-lint schema contracts/beacon_v8.py
genvm-lint typecheck contracts/beacon_v8.py --strict

# Frontend gates
Set-Location app
npm test -- --run
npm run typecheck
npm run build
```

Toolchain pins are in [`requirements.txt`](requirements.txt) and the root/app
package manifests. No deployment, GitHub push, or production update is part
of the current checkpoint.
