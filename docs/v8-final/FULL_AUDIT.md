# Beacon V8 final release audit

Audit date: 2026-09-12. This record covers the reviewer-visible branch
forensics, proven stable source, local harness, frontend, deployment path,
freeze artifacts, Studionet live proof, GitHub publication, and Vercel
production publication.

## Release record

| Field | Value |
|---|---|
| `PRE_RELEASE_MAIN_HEAD` | `03edecbb20acead7705c785f7b15391cf4cb57cf` |
| `V8_PUBLICATION_COMMIT` | `baf5dac3ee09f9c515942ce7f585fa628b1ee0ac` |
| `PUBLICATION_MODE` | fast-forward; no force-push |
| `FINAL_SOURCE` | `contracts/beacon_v8_studionet.py` |
| `FINAL_SOURCE_SHA256` | `698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c` |
| `FINAL_SOURCE_BYTES` | `44394` |
| `LIVE_NETWORK` | GenLayer Studionet / chain `61999` |
| `LIVE_CONTRACT` | `0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1` |
| `PRODUCTION_URL` | `https://beacon-rho-brown.vercel.app` |
| `REVIEWER_STATE` | published and reviewer-safe |

Before V8 publication, public `main` still exposed the rejected legacy
implementation. That pre-release state is retained in Git history for audit
provenance. The current release line exposes the reviewer-fixed V8 source and
supporting evidence. Documentation-only synchronization commits after the V8
publication commit do not modify the frozen contract source.

## Compact issue matrix

| ISSUE | SEVERITY | FINAL STATE | REVIEWER IMPACT | TEST / EVIDENCE | LIVE PROOF |
|---|---|---|---|---|---|
| Public branch stale | CRITICAL | RESOLVED | Reviewer now sees V8 on `main` | public source SHA parity | GitHub publication complete |
| Provider identity binding | CRITICAL | RESOLVED | Provider IDs cannot borrow identity | wrong-address/provider-borrowing tests | Both bindings `VERIFIED` |
| Semantic source authority | CRITICAL | RESOLVED | Caller cannot redirect judgment to another asset/source | authority negative matrix | Five roles verified; ISSUER exact-address anchor |
| Reassessment completeness | CRITICAL | RESOLVED | No first-challenge shortcut or blanket resolution | two-challenge and rollback tests | Passport V2 count 2; A/B independently resolved |
| Consensus equivalence | HIGH | RESOLVED | Presentation changes do not split consensus; identity/risk facts do | equivalence robustness tests | Stable live proof finalized |
| Storage/atomicity | HIGH | RESOLVED | No cross-version leakage or partial resolution | duplicate/stale/rollback tests | V2 challenge set digest read back |
| Stable local harness | HIGH | RESOLVED | Release tests are network/runtime-specific and reproducible | 29 contract tests passed | Existing live proof is stable Studionet |
| Stable static typing | MEDIUM | DOCUMENTED TOOLING LIMITATION | Strict RC typing is not used to misclassify the live-proven stable source | AST lint and stable-bundle validation pass | Live execution successful |
| Frontend network/finality | HIGH | RESOLVED | UI targets the live Studionet contract and does not treat ACCEPTED as success | 21 frontend tests, typecheck/build pass | Production smoke/readback pass |
| Deployment source selection | CRITICAL | RESOLVED | Operator cannot silently deploy old bytes | source parity and frozen SHA | Address/source ledger match |
| Toolchain metadata | MEDIUM | DOCUMENTED PACKAGING EXCEPTION | Stable pins remain explicit | isolated harness | Same stable line as live proof |
| Mutation framework | LOW | NOT_CONFIGURED | No mutation evidence is claimed | N/A | N/A |

## Historical local failure cascade

The original non-live run collected 202 tests and returned `194 failed, 7
passed, 1 skipped`. `gltest` reported missing configuration, selected
`http://127.0.0.1:4000/api`, and repeated
`ImportError: Failed to load contract: unexpected end of memory`. The grouped
classification is preserved in
[`LOCAL_TEST_FAILURE_CLASSIFICATION.md`](LOCAL_TEST_FAILURE_CLASSIFICATION.md).
Those results are historical harness failures, not 194 independent V8 contract
defects.

The final release validation records `29 passed` contract tests, `21 passed`
frontend tests, frontend typecheck PASS, frontend build PASS, source parity
PASS, npm audits with 0 vulnerabilities, clean `pip-audit`, and a clean bounded
secret scan.

## Live proof

The exact live deployment and full reviewer lifecycle are recorded in
[`STUDIONET_LIVE_PROOF.md`](STUDIONET_LIVE_PROOF.md). The read-only verifier
asserts chain `61999`, the live address, canonical identity, both provider
bindings, all five semantic roles, Passport V1/V2, and both independent
challenge resolution records.

The final live state contains Passport V2 with `challenge_count = 2`. Both
challenge records are `RESOLVED` with independent `SUPPORTED` / `MATERIAL`
results and `resolution_version = 2`.

## Production publication

GitHub `main` was published by fast-forward and the public contract source SHA
matches the frozen live source. The frontend was then deployed and promoted on
Vercel at `https://beacon-rho-brown.vercel.app`. Production checks confirmed
HTTP 200, the app shell, `/proof`, compiled active Studionet configuration,
canonical USDC identity, both provider bindings, Passport V2, and both V2
challenge records.

Browser-console automation was unavailable in the publication environment;
direct HTTP and live read-only verification passed. This is documented as a
verification limitation, not a release blocker.

## Release conclusion

Beacon V8 is published, production is live, the frozen contract source remains
unchanged, and the repository evidence matches the live Studionet state. No
known publication blocker remains. The release is ready for reviewer
resubmission.
