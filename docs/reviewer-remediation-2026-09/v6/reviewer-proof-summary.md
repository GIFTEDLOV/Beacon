# Beacon V6 reviewer proof summary

Network: GenLayer Testnet Bradbury, chain ID 4221. Contract:
`0xE3706dc54B2Ca0a33941753Bc214f95670Fee7Fb`.

## Item 1 — authenticated identity and semantic authority

The canonical asset is
`eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`.

The finalized evaluation transaction is
`0x6346bc9e2a243bf4b5f7e0b2ac9a22a365f4e14121422bea30f378db8f3fbc95`:
`FINALIZED / FINISHED_WITH_RETURN / AGREE`. Readback records:

- `identity_status = VERIFIED`;
- canonical chain `ethereum`, namespace `eip155:1`, and the exact USDC address;
- authenticated name/symbol `USDC / USDC`;
- CoinGecko `usd-coin / VERIFIED`;
- CoinPaprika `usdc-usd-coin / VERIFIED`;
- official issuer domain `circle.com`;
- issuer, redemption, backing, security, and governance authority and asset
  binding statuses all `VERIFIED`.

Validator evidence is preserved exactly: `3 AGREE`, `1
DETERMINISTIC_VIOLATION`, and `1 TIMEOUT`. This is not described as unanimous.

The negative control used the same USDC claims with
`eip155:1:0x2222222222222222222222222222222222222222`. Its finalized evaluation
was `0xa16cfa68208b7c04fbcdb7a86792f7a1b965003229ffa7cd33b7a72f06f5ba84`,
`FINALIZED / FINISHED_WITH_RETURN / AGREE`. Readback preserved the wrong
address, recorded `identity_status = UNVERIFIED`,
`failure_state = ASSET_IDENTITY_UNVERIFIED`, and left both provider bindings
`UNVERIFIED`. The arbitrary address was not authenticated as USDC.

## Item 2 — all-open-challenge reassessment control flow

The deployed V6 source implements `MAX_OPEN_CHALLENGES = 8`, collects every
OPEN challenge targeting the current version, sorts by `challenge_id`, and
retains each challenge's category, bounded raw reason, reason digest, and
evidence URL. Each challenge is independently fetched, asset-bound, judged,
and represented in the challenge-set digest. Resolution occurs only after the
new Passport is stored; a failure aborts the write atomically.

Relevant implementation points are `challenge_asset`, `_challenge_evidence`,
`_challenge_validator`, `_challenge_set_digest`, `_store_evaluation`, and
`reassess_asset` in `contracts/beacon_v6.py`. Local proof includes:

- `test_v6_reassessment_orders_and_resolves_every_challenge`;
- `test_v6_three_challenges_are_all_assessed_with_reason_and_evidence`;
- `test_v6_challenge_set_digest_changes_for_reason_or_evidence`;
- `test_v6_maximum_open_challenges_is_enforced`;
- `test_v6_one_failed_challenge_keeps_entire_set_open`;
- `test_v6_transient_reassessment_failure_is_atomic`; and
- `test_v6_raw_web_body_is_not_challenge_equivalence_criterion`.

Live pre-reassessment readback proved two distinct current-version challenges:

- REDEMPTION, OPEN/PENDING, reason digest
  `73dd0b6c91ae2ed55a6707c62a59e25018ef8cde7652afd1b7034f4a2e886d17`;
- BACKING, OPEN/PENDING, reason digest
  `84eef6384818ed58b07ca8c540dc87795898566b113c53f7c90f7835cf15a6c9`.

`OPEN_CHALLENGE_COUNT = 2`, asset lifecycle was `CHALLENGED`, and Passport was
version 1.

The reassessment used protocol transaction
`0xe1aee4247d31a528b22f48ea8a5d2a3a6bd18fdf10956aa9115e6a9f4c63728c` (outer
EVM transaction
`0x0ca2d940c24e9454b988d2db02572c970eda4b7027f4e0e66a31f5ef4275bd75`). It
ended `UNDETERMINED / 6` with aggregate `DISAGREE`: 12
`DETERMINISTIC_VIOLATION`, 5 `TIMEOUT`, and 0 `AGREE`.

The live attempt collected and sorted both challenges, and the leader output
contained assessments for both. Raw evidence bodies were not cross-validator
equality targets, and `evidence_digest` was not the validator equality
condition. No multi-challenge source defect was identified. Post-state stayed
atomically unchanged: Passport v1 remained current, Passport v2 was absent,
and both challenges remained OPEN/PENDING.

Live finalized multi-challenge readback was not obtained because the Bradbury
reassessment reached terminal UNDETERMINED. Source/tests establish the
remediated all-challenge control flow, while the live attempt additionally
demonstrated that consensus failure does not partially resolve challenges.

## Source identity

The deployed compact V6 source is `contracts/beacon_v6.py`, commit
`a8a13da99030771e3530e35eb28b9083c94ea847`, SHA-256
`caf91af1184168f7ff2d14cafabc8afdbccefb15f69af94b789f8bf9b9af5a4c`, 49,301
bytes. `contracts/beacon.py` remains the historical V4 source and was not
changed.
