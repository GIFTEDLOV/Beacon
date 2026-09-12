# Stable Studionet local-test failure classification

Audit date: 2026-09-12. This report classifies the original `194 failed, 7
passed, 1 skipped` run; it does not treat the shared loader failure as 194
independent Beacon defects.

| Root cause | Affected count | Source defect | Harness defect | Remediation / final result |
|---|---:|---|---|---|
| A. `gltest` defaulted to localnet | 194 observed failures | NO | YES | Added the repository `gltest.config.yaml` defaulting to the built-in `studionet` definition and made the stable runner pass `--network studionet --chain-type studionet --rpc-url https://studio.genlayer.com/api`. |
| B. Wrong GenVM/cache family and rate-limited version discovery | 194 shared loader failures | NO | YES | Isolated the stable harness and pinned its cache to the tested GenVM bundle selected by `gltest` 0.29.2. No RC package is used by the stable command. |
| C. Historical V4/V5/V6/V7 assumptions | 171 collected historical tests | NO | YES / obsolete release scope | Kept historical suites for provenance; they are not stable V8 release gates. Stable V8 coverage is in `test/test_beacon_v8.py`. |
| D. Stable fixture endpoint mismatch | 5 initial stable-target failures | NO | YES | Stable source uses CoinPaprika `/v1/tickers/`; the fixture now selects that endpoint only in the stable harness. Final stable V8 run: `27 passed`. |
| E. Stable SDK/test package metadata conflict | 1 environment resolution issue | NO | YES / upstream metadata | `genlayer-test==0.29.2` declares `genlayer-py<0.17`, while the required stable line is `genlayer-py==0.18.0`. The isolated harness installs the exact tested pair with `--no-deps` and documents the expected `pip check` warning. |
| F. Incompatible mocked runtime API | 0 after remediation | NO | YES | Stable mock payloads use the stable decoder shape; RC-only byte payload behavior remains in the RC path. |
| G. Genuine Beacon source defect | 0 found | NO | NO | The proven `contracts/beacon_v8_studionet.py` source was not edited. Live readback and the stable-target direct suite both pass. |
| H. Strict GenVM Pyright typing | stable-source command; no runtime test failures | NO | YES / linter-stub gap | Stable validation and AST lint pass. The available linter has no complete typed-stub model for the stable wildcard API, so strict Pyright diagnostics are recorded and excluded from the stable contract gate. |

## Reproduction command

From the repository root:

```powershell
.\tools\run-studionet-tests.ps1
```

The command creates an isolated environment outside the repository, uses the
stable package pins in `requirements-studionet.txt`, selects the built-in
Studionet network, and runs the stable V8 contract suite plus deployment-source
parity tests. It performs no live writes.

## Release-gate boundary

The old all-repository run is retained as a historical diagnostic. Its failure
signature was `ImportError: Failed to load contract: unexpected end of memory`
after `gltest` selected `http://127.0.0.1:4000/api`; it was not evidence that
the live-proven stable V8 contract was defective. Unsupported historical
contracts are not allowed to redefine the stable Studionet release gate.
