# Beacon V8 final local audit

Audit date: 2026-09-12. This audit covers the reviewer-visible branch
forensics, proven stable source, local harness, frontend, deployment path,
freeze artifacts, and the existing Studionet live proof. It does not push
GitHub or change production.

## Forensic record

| Field | Value |
|---|---|
| `LOCAL_BRANCH` | `v8-lean-final` |
| `LOCAL_HEAD` | `3baafb57c311700c27b00d94941fd19b4e23e57c` plus uncommitted release-prep changes |
| `REMOTE_MAIN_HEAD` | `03edecbb20acead7705c785f7b15391cf4cb57cf` |
| `REMOTE_V6_REASSESSMENT_HEAD` | `754f390ab2f2433ff5db1c21092345aedc3600c2` |
| `REMOTE_MAIN_STATE` | Old rejected implementation remains on public `main`; local V8 fixes are unpublished |
| `FINAL_SOURCE` | `contracts/beacon_v8_studionet.py` |
| `FINAL_SOURCE_SHA256` | `698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c` |
| `FINAL_SOURCE_BYTES` | `44394` |

The public branch was inspected before release preparation and still exposed
caller-selected provider IDs/semantic URLs without chain/address authority
binding and the first-open-challenge reassessment shortcut. The reviewer would
therefore still reject public `main` until the prepared release is authorized
and published.

## Compact issue matrix

| ISSUE | SEVERITY | CURRENT STATE | REVIEWER IMPACT | FIX REQUIRED | TEST | LIVE PROOF |
|---|---|---|---|---|---|---|
| Public branch is stale | CRITICAL | `main` is old rejected code | Reviewer can inspect the wrong implementation | Publish prepared release after authorization | release diff/source scan | Not pushed |
| Provider identity binding | CRITICAL | Exact namespace/address and independent CoinGecko/CoinPaprika records required | Provider IDs cannot borrow identity | Keep stable source frozen | wrong-address/provider-borrowing tests | Both bindings `VERIFIED` |
| Semantic source authority | CRITICAL | Approved Circle URLs; transport, host, redirect, role, chain, asset, size and prompt checks fail closed | Caller cannot redirect judgment to another asset/source | Keep contract-controlled source set | authority negative matrix | Five roles verified; ISSUER exact-address anchor |
| Reassessment completeness | CRITICAL | Every eligible OPEN challenge is sorted, validated, independently evaluated, and resolved after Passport storage | No first-challenge shortcut or blanket resolution | Keep stored evidence and per-record outputs | two-challenge and rollback tests | Passport V2 count 2; A/B independently resolved |
| Consensus equivalence | HIGH | Closed decision witnesses compare decision-bearing facts only | Presentation changes do not split consensus; identity/risk facts do | Keep bounded schemas | equivalence robustness tests | Stable live proof finalized |
| Storage/atomicity | HIGH | Version-targeted challenge records, digests, and post-Passport resolution ordering | No cross-version leakage or partial resolution | Keep current implementation | duplicate/stale/rollback tests | V2 challenge set digest read back |
| Stable local harness | HIGH | Original run defaulted to localnet and failed in shared loader; isolated stable harness now explicit | Green/failing results are network/runtime-specific | Use stable pins and explicit Studionet | 27 stable tests pass | Existing live proof is stable Studionet |
| Stable static typing | MEDIUM | Stable-bundle validation passes; installed linter's Pyright mode lacks typed stubs for the stable wildcard API | Strict RC typing output would misclassify a live-proven stable source | Keep the limitation explicit; do not alter frozen source for linter cosmetics | AST lint/check pass; strict diagnostic recorded | Live execution is successful |
| Frontend network/finality | HIGH | Stable Studionet adapter, active address, and status distinction prepared | UI cannot target old Bradbury contract or treat ACCEPTED as success | Keep one adapter and same-ID recovery | frontend tests/typecheck/build | UI points at live contract |
| Deployment source selection | CRITICAL | Stable deployment path reads only frozen Studionet source and verifies SHA | Operator cannot silently deploy old bytes | Freeze SHA and use official SDK call | source parity test | Address/source ledger match |
| Toolchain metadata | MEDIUM | Stable pins are isolated; upstream `genlayer-test 0.29.2` metadata conflicts with required `genlayer-py 0.18.0` | Naive resolver may select wrong SDK | Install exact pair with documented `--no-deps` exception | harness script | Same stable line as live proof |
| Mutation framework | LOW | Not configured | No mutation evidence can be claimed | Record `NOT_CONFIGURED` | N/A | N/A |

## Reproduced local failure cascade

The original non-live run collected 202 tests and returned `194 failed, 7
passed, 1 skipped`. `gltest` reported missing configuration, selected
`http://127.0.0.1:4000/api`, and repeated
`ImportError: Failed to load contract: unexpected end of memory`. The grouped
classification is in [`LOCAL_TEST_FAILURE_CLASSIFICATION.md`](LOCAL_TEST_FAILURE_CLASSIFICATION.md).

After the stable harness was isolated, explicitly configured, and given the
stable fixture endpoint, `test/test_beacon_v8.py` completed with `27 passed`.
No genuine stable source defect was found and the proven source was not edited.

## Existing live proof

The exact live deployment and full reviewer lifecycle are recorded in
[`STUDIONET_LIVE_PROOF.md`](STUDIONET_LIVE_PROOF.md). The read-only verifier
asserts chain 61999, the live address, canonical identity, provider bindings,
all five semantic roles, Passport V1/V2, and both independent challenge
resolution records.

## Release conclusion

The proven source is locally parity-checked and the stable harness is
reproducible. The implementation is not yet reviewer-safe on GitHub because
public `main` remains unchanged. Publication and any production deployment
remain separate, explicitly authorized actions.
