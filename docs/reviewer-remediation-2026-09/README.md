# Beacon reviewer remediation

Beacon V6 is the approved compact remediation candidate for GenLayer Testnet
Bradbury (chain ID 4221). The deployed V6 contract is
`0xE3706dc54B2Ca0a33941753Bc214f95670Fee7Fb`.

## Reviewer path

1. V4 accepted arbitrary token/claim pairings and reused only the first open
   challenge during reassessment. The historical V4 source remains at
   `contracts/beacon.py` and is unchanged.
2. V6 binds normalized Ethereum identity to exact CoinGecko and CoinPaprika
   contract-address records, authenticates Circle semantic authorities, bounds
   challenge work, evaluates every open challenge, and stores resolution only
   after Passport persistence. The deployed source is
   `contracts/beacon_v6.py`.
3. Positive canonical-USDC proof: see
   `v6/reviewer-proof-summary.md` and
   `v6/clean-proof-canonical-usdc/evaluation/`.
4. Wrong-address fail-closed proof: see
   `v6/proof-2-wrong-address/evaluation/`.
5. Two-open-challenge proof: see
   `v6/proof-3-multi-challenge/challenge-a/`, `challenge-b/`, and
   `reassessment/precondition.json`.
6. Source/test reassessment proof: see
   `contracts/beacon_v6.py`, `test/test_beacon_v6.py`,
   `test/test_beacon_v6_source_manifest.py`, and
   `test/test_v4_steward_regressions.py`.
7. The live reassessment attempt is preserved in
   `v6/proof-3-multi-challenge/reassessment/`. It reached terminal
   `UNDETERMINED` with 12 deterministic violations and 5 timeouts. No
   Passport v2 was claimed; readback confirmed both challenges remained
   OPEN/PENDING, demonstrating atomic non-resolution.
8. Exact source, deployment, proof transaction IDs, and the separate outer EVM
   / GenLayer protocol identifiers are in `beacon-v6-reviewer-manifest.json`.
9. The historical Bradbury payload-limit diagnosis and compact deployment
   estimate are preserved in `v6/pubdata-diagnostic/`.

The public UI is configured for the V6 address but continues to display the
actual live challenged state and does not claim finalized multi-challenge
reassessment.
