# Studionet fee profile summary

The active release profile is [`deploy/v8/fee-profile.json`](../../deploy/v8/fee-profile.json).

| Field | Value |
|---|---|
| Network | Studionet |
| Chain ID | `61999` |
| SDK | `genlayer-js 1.1.8` |
| Fee mode | `gasless_or_network_default` |
| Headroom | `N/A` — stable Studionet returned network-default behavior |
| Synthetic per-method values | Not generated |

The stable SDK deployment/write route does not accept the RC fee object used by
the historical Consensus v0.6 harness. The release tooling therefore passes
no fabricated `distribution` or `feeValue`; it uses the official stable route
and records live transaction IDs in `STUDIONET_LIVE_PROOF.md`.

Coverage is the complete reviewer lifecycle: deploy, submit, both provider
identity checkpoints, five semantic checkpoints, both market checkpoints,
evaluate, two challenge creations, and one two-challenge reassessment. The
profile is descriptive of the stable route; it is not a synthetic quote table.
