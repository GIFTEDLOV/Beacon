# Beacon checkpointed-consensus architecture

This artifact records the local, read-only gate for the staged external-evidence
architecture implemented in `contracts/beacon_v7.py`. No Bradbury transaction,
deployment, evaluation, challenge, or reassessment was sent for this change.

## Architecture and work budget

| Public write | External web calls | LLM calls | Persisted result |
| --- | ---: | ---: | --- |
| `submit_asset` | 0 | 0 | claims and source URLs only |
| `verify_coingecko_identity` | 1 | 0 | exact id/address/symbol/name checkpoint |
| `verify_coinpaprika_identity` | 1 | 0 | exact id/address/symbol/name checkpoint |
| `verify_semantic_source(role)` | 1 | 0 | authority/binding plus bounded excerpt/digest |
| `refresh_coingecko_market` | 1 | 0 | bounded price/risk snapshot |
| `refresh_coinpaprika_market` | 1 | 0 | bounded price/risk snapshot |
| `evaluate_asset` | 0 | 1 bounded structured judgment | Passport from stored checkpoints |
| `challenge_asset` | 1 | bounded challenge judgment | authenticated bounded evidence |
| `reassess_asset` | 0 for challenge evidence | bounded judgment per open challenge | Passport before atomic resolution |

`MAX_OPEN_CHALLENGES` remains 8. Challenge creation retains a 65,536-byte
fetch ceiling and 2,800-byte stored-evidence ceiling. Reassessment reads the
stored authenticated evidence and does not refetch challenge URLs. Identity is
derived as VERIFIED only after both provider checkpoints authenticate the same
chain, exact address, provider IDs, and compatible name/symbol claims. Final
evaluation fails closed unless both market snapshots are fresh and all five
semantic checkpoints are verified.

## Consensus variability gate

The focused V7 suite exercises leader/validator variability with stable
decision-bearing facts and changing incidental fields:

- CoinGecko identity: 20/20 healthy simulations agree.
- CoinPaprika identity: 20/20 healthy simulations agree.
- CoinGecko market: 20/20 healthy simulations agree.
- CoinPaprika market: 20/20 healthy simulations agree.
- All five semantic roles: 20/20 healthy simulations agree.
- CoinPaprika `OTHER` challenge: 20/20 healthy simulations agree.
- DexScreener `LIQUIDITY` challenge: 20/20 healthy simulations agree.
- Wrong address and wrong category-binding facts fail closed.
- Two-, three-, and eight-open-challenge reassessments retain all-open
  evaluation, deterministic digest coverage, and atomic resolution.

Failure-isolation tests cover provider timeout, semantic-source timeout, and
market-source failure. Prior successful checkpoint state remains stored while
the failed checkpoint remains incomplete.

## Read-only endpoint burst diagnostic

The diagnostic used two concurrent requests per endpoint (a small, non-abusive
batch; no keys and no writes). All 20 requests returned HTTP 200 with zero
HTTP 429s and zero timeouts:

| Endpoint group | Response bytes | Approx. latency per request |
| --- | ---: | ---: |
| CoinGecko identity | 12,450 | 1.04 s |
| CoinGecko market | 38,952 | 0.98–0.98 s |
| CoinPaprika identity/market | 5,753 | 2.94 s |
| Circle issuer | 349,966 | 1.86–1.87 s |
| Circle redemption | 374,042 | 1.21–1.23 s |
| Circle backing | 302,166 | 0.95 s |
| Circle security | 432,650 | 1.08–1.09 s |
| Circle governance | 339,784 | 1.02–1.03 s |
| CoinPaprika challenge | 5,753 | 1.00 s |
| DexScreener challenge | 1,792 | 0.97–0.98 s |

This small burst does not establish that a keyless public API is production
grade under arbitrary distributed-validator load. The residual supplier
rate-limit/availability dependency is isolated to its own checkpoint write;
`evaluate_asset` no longer fans out to those endpoints.

## Deployment payload gate

The exact installed GenLayer v0.6 serialization path was used: three-item RLP
deployment payload, six-argument `ConsensusMain.addTransaction`, Bradbury
chain ID 4221, five initial validators, three maximum rotations.

| Measure | Result |
| --- | ---: |
| Source bytes | 52,843 |
| Serialized deploy bytes | 52,851 |
| Outer calldata bytes | 53,092 |
| Read-only Bradbury estimate | SUCCESS |
| Estimated gas | 41,894,200 |

Final candidate source SHA256: `e217b7fc85835447e662d5863fc31d5e1c86384e8cfd0280c7f10043d0a97bbd`.

No broadcast was performed.

## Local gate

- Full Python tests: 170 passed.
- V7 focused tests: 29 passed.
- Frontend tests: 23 passed.
- Frontend TypeScript check: passed.
- GenVM lint: passed (3 checks).
- GenVM validation: passed (18 methods; 9 view, 9 write).
- Frontend production build: passed.
- `git diff --check`: passed.

The exact final candidate commit is recorded by Git after the final review of
this artifact and the staged frontend/reviewer documentation.
