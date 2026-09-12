# Beacon V8 stable Studionet test matrix

## Stable release checks

| Area | Command/evidence | Result |
|---|---|---|
| Stable direct V8 tests | `tools/run-studionet-tests.ps1` → `gltest test/test_beacon_v8.py --network studionet --chain-type studionet --rpc-url https://studio.genlayer.com/api` | PASS; 27 passed |
| Deployment source parity | same command plus `test/test_deployment_source.py` | PASS |
| GenVM AST lint | `genvm-lint lint contracts/beacon_v8_studionet.py --json` | PASS; 3 checks |
| Stable-bundle validation | `GENVM_VERSION=v0.3.0-rc7 genvm-lint validate ... --json` | PASS; 18 methods, 9 views, 9 writes |
| Strict GenVM typecheck | available linter with stable header | NOT A VALID STABLE GATE; typed-stub/tooling mismatch, documented in `TOOLCHAIN.md` |
| Contract source parity | `contracts/beacon_v8_studionet.py` | PASS; 44,394 bytes; SHA-256 `698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c` |
| Frontend tests | `npm test -- --run` | PASS; 21 passed |
| Frontend typecheck | `npm run typecheck` | PASS |
| Frontend build | `npm run build` | PASS; Vite warning only for a large chunk |
| Secret scan | bounded repository scan; `gitleaks` unavailable | PASS; no credential patterns found |
| Dependency audit | npm audit root/app; `pip-audit --local` in isolated stable harness | PASS; no known vulnerabilities |

## Required adversarial coverage

The stable direct V8 suite covers canonical asset normalization, exact token
address binding, genuine provider IDs paired with the wrong address, provider
ID borrowing, provider disagreement, unapproved/redirected/oversized semantic
sources, wrong-chain and role-irrelevant pages, prompt injection, missing
issuer address binding, presentation-only consensus changes, malformed/stale/
outage market data, unauthenticated challenge evidence, zero challenge-evidence
refetch during reassessment, two independent challenge outcomes, and atomic
rollback when challenge two fails.

## Scope and exceptions

The original all-repository pytest run produced `194 failed, 7 passed, 1
skipped`. The grouped diagnosis found a shared localnet/default-runner failure,
not 194 independent contract defects. Historical V4/V5/V6/V7 tests remain
available for provenance but are not stable release gates; see
`LOCAL_TEST_FAILURE_CLASSIFICATION.md`.

No mutation-test framework is configured:
`MUTATION_TESTS = NOT_CONFIGURED`.

The live reviewer lifecycle is already proven on Studionet and is checked
read-only by `tools/verify_studionet_release.mjs`.
