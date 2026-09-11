# V8 test matrix

## Completed local checks

| Area | Command/evidence | Result |
|---|---|---|
| GenVM lint + validation | `genvm-lint check contracts/beacon_v8.py --json` | PASS |
| Schema generation | `genvm-lint schema contracts/beacon_v8.py --json` | PASS; 18 public methods |
| Strict typecheck | `genvm-lint typecheck contracts/beacon_v8.py --strict --json` | PASS; 0 diagnostics |
| Contract size | 41,739 bytes at this checkpoint | PASS; under 45,000-byte release target |
| Direct V8 tests | `python -m pytest -q test/test_beacon_v8.py` with current suite source | PASS; 14 passed |
| Frontend tests | `npm test -- --run` | PASS; 23 passed |
| Frontend typecheck | `npm run typecheck` | PASS |
| Frontend build | `npm run build` | PASS; non-blocking large-chunk warning |

The strict typecheck uses explicit dynamic-JSON exemptions at the contract
header because checkpoint JSON is intentionally decoded from untrusted
external data. No executable safety diagnostic was suppressed.

## Adversarial coverage

The direct V8 suite covers genuine USDC IDs paired with a wrong address,
wrong provider IDs, provider disagreement, wrong/redirected/oversized semantic
sources, missing issuer address binding, presentation-only witness changes,
malformed/stale/outage market data, unauthenticated challenge evidence,
zero-fetch evaluation, two independent challenge outcomes, and rollback when
challenge two fails.

## Not completed

Studio-dev validator execution, fee profiling, Bradbury deployment, and live
Bradbury lifecycle proof are not claimed. The installed `gltest` package does
not expose the documented `--fee-profile` generation surface, so the fee
profile prerequisite remains an external toolchain blocker.
