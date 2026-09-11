# V8 reference implementation findings

These are the implementation patterns Beacon V8 adopts from the reviewed
PolicyDelta, Dominion, and Crown repositories.

## PolicyDelta

- Keep semantic nondeterminism narrow and return a small closed result.
- Store immutable evidence and derive authorization/policy consequences
  deterministically in contract state.
- Separate an account-free read client from a provider-backed write client.
- Centralize writes and distinguish submitted, accepted, finalized, and
  successful execution states.
- Freeze source hashes and preserve deployment/evidence artifacts for review.

## Dominion

- Keep external source selection contract-owned and HTTP bounded.
- Parse and normalize source-local facts before consensus; compare a stable
  witness rather than raw responses.
- Treat external failure as unavailable/inconclusive, not as a negative fact.
- Validate structured evaluator output strictly and use one adapter for the
  contract transaction lifecycle.

## Crown

- Bound stored web evidence and make the common decision-bearing witness
  explicit.
- Allow harmless presentation differences while preserving consequential fact
  changes.
- Write state only after all prerequisites and deterministic consequences are
  ready.
- Make retries and inconclusive outcomes explicit instead of silently treating
  transient source failure as a risk verdict.

## Beacon V8 adoption

V8 applies these lessons to exact asset identity, five role-specific semantic
checkpoints, two independent market checkpoints, deterministic Passport
construction, and atomic all-open-challenge reassessment. The references are
architectural guidance; V8 uses the current GenLayer v0.6-compatible API and
does not copy legacy SDK calls.
