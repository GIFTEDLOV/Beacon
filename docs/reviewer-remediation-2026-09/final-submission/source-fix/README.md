# Authenticated semantic checkpoint fix

This candidate addresses the proven issuer-checkpoint `NondetDisagree` at the
semantic checkpoint's first nondeterministic call.

- The five Circle role inputs use the provider's official machine-readable
  Markdown siblings.
- The issuer role requires direct Ethereum USDC address and chain evidence.
- Redemption, backing, security, and governance require authorized Circle
  authority, unambiguous USDC/role evidence, and inherit the exact address
  anchor already verified independently by CoinGecko and CoinPaprika.
- Validator equivalence compares stable authenticated predicates and identity
  anchor fields computed from the full authenticated response. It does not
  compare rendering-dependent reduced excerpts, offsets, serialization, or
  live evidence digests.
- The bounded excerpt and digest remain stored as the accepted checkpoint
  evidence commitment.
- `evaluate_asset` remains web-free and consumes only finalized checkpoints;
  reassessment remains web-free for challenge evidence.

The earlier HTML-source failure and all historical deployments remain
preserved under the prior reviewer-remediation directories.
