# Beacon V8

Beacon is a versioned collateral-risk registry for stablecoins and other
stable-value assets. It combines authenticated identity, bounded semantic
evidence, objective market checkpoints, deterministic policy, and challenge
reassessment into a readable Passport.

## Final Studionet release

The live-proven release is GenLayer Studionet, chain `61999`:

| Field | Value |
|---|---|
| RPC | `https://studio.genlayer.com/api` |
| Contract | `0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1` |
| Deployment transaction | `0xf890b6bada92e8d42f2f8580cbdf10e39b1459d86f4f836425f8e0ab179286fc` |
| Frozen source | [`contracts/beacon_v8_studionet.py`](contracts/beacon_v8_studionet.py) |
| Source SHA-256 | `698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c` |
| Source bytes | `44394` |
| Deployment result | `FINALIZED` / `FINISHED_WITH_RETURN` |

The complete live ledger and read-only verification command are in
[`docs/v8-final/STUDIONET_LIVE_PROOF.md`](docs/v8-final/STUDIONET_LIVE_PROOF.md).

## The two reviewer fixes

1. Provider IDs are claims, not identity. Chain aliases normalize to the
   canonical namespace `eip155:1`; the exact token address determines the
   asset ID. CoinGecko and CoinPaprika must independently bind their Ethereum
   platform/token records to that exact address and to the same canonical
   asset before identity becomes `VERIFIED`.

2. Reassessment enumerates every `OPEN` challenge for the current Passport
   version, validates each stored record, and evaluates each independently
   using its own category, reason, digests, and authenticated stored evidence.
   It creates Passport V2 before resolving challenges and records an individual
   result, reason code, and resolution version for each one. Reassessment does
   zero challenge-evidence web refetches and rolls back atomically on failure.

## Identity and source authority

The canonical Ethereum USDC asset is:

`eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`

The ISSUER page is the exact-address Circle authority anchor. The approved
REDEMPTION, BACKING, SECURITY, and GOVERNANCE pages authenticate Circle
authority and role-relevant USDC facts while inheriting the already verified
canonical identity. URLs are contract-controlled and source checks are
fail-closed for HTTPS, host/path, redirects, private hosts, size, asset, chain,
role, and prompt-injection content.

## Architecture and policy

V8 stores bounded identity, semantic, market, challenge, and Passport records.
Consensus compares closed decision-bearing witnesses rather than complete HTML,
Markdown, JSON ordering, timestamps, or presentation text. Semantic checkpoints
run only after canonical identity is verified. `evaluate_asset` uses stored
checkpoint state and applies the deterministic mapping:

`CORE → 8000 bps`, `STANDARD → 6500 bps`, `WATCH → 2000 bps`, `REJECT → 0 bps`.

Failure and unavailable evidence never become a favorable tier.

## Frontend and deployment

The frontend uses one stable Studionet adapter and reads authoritative state
from the contract. Writes precondition, sign once, persist the GenLayer
transaction ID immediately, reconcile that same ID, and require
`FINALIZED` plus `FINISHED_WITH_RETURN` before reading final state. `ACCEPTED`
or `FINALIZED` alone is not user-facing success. Production configuration is
prepared in `app/.env.production`; no production deployment was performed.

The deployment path reads only the frozen stable source and uses the official
stable `genlayer-js` 1.1.8 route. It cannot be redirected to an older source or
network by an environment variable.

## Verification and tests

Read the reviewer mapping in
[`docs/v8-final/REVIEWER_EVIDENCE_MATRIX.md`](docs/v8-final/REVIEWER_EVIDENCE_MATRIX.md)
and run the existing live-state verifier without any write:

```powershell
npm run verify:studionet
```

Stable local contract tests use the isolated harness:

```powershell
.\tools\run-studionet-tests.ps1
```

This executes the stable Studionet V8 suite and source-parity checks. The
historical V4/V5/V6/V7 suites remain labeled under History and are not release
gates. The original 194 failures were grouped as a localnet/default-runner and
obsolete historical-harness problem; see
[`docs/v8-final/LOCAL_TEST_FAILURE_CLASSIFICATION.md`](docs/v8-final/LOCAL_TEST_FAILURE_CLASSIFICATION.md).

## History

Earlier V4/V5/V6/V7 sources and Bradbury/Studio-dev diagnostic artifacts are
preserved for audit provenance. They are not the active contract, frontend
configuration, deployment path, or reviewer evidence for this release.
