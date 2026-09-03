# Beacon V5 consensus and provenance

Beacon V5 is a new contract. The deployed V4 address and `contracts/beacon.py`
remain historical and are not treated as V5.

## Asset identity

The root identity is the canonical EVM namespace plus normalized address:

```text
eip155:1:<lowercase-ethereum-address>
```

V5 currently supports Ethereum mainnet only. `ethereum`, `eth`, and `mainnet`
are accepted as explicit aliases for `eip155:1`; arbitrary chain labels and
non-EVM addresses fail closed.

The identity nondeterministic stage runs before objective or semantic risk
evaluation. Both leader and validators independently fetch:

- CoinGecko `api.coingecko.com/api/v3/coins/{platform}/contract/{address}`;
- CoinPaprika `api.coinpaprika.com/v1/contracts/{platform}/{address}`.

The provider IDs are derived from those address-bound responses and stored only
after the identity result reaches consensus. Optional submitted name, symbol,
and market-ID fields are claims. A claim mismatch produces
`ASSET_IDENTITY_CONFLICT`; a missing, malformed, or address-mismatched provider
response produces `ASSET_IDENTITY_UNVERIFIED`. Neither state reaches normal
collateral evaluation and both map to `REJECT` / `0` BPS.

## Source authority

CoinGecko homepage metadata establishes the candidate official issuer root
domain. For issuer, redemption, backing, and governance roles, the submitted
source must be on that domain (or a subdomain) and its independently fetched
content must include the verified address and symbol/name. Security sources may
also use the bounded recognized audit-domain set, with the same exact-asset
binding check. HTTPS syntax alone is never authority.

The Passport stores authority and exact-asset-binding status for every role,
the official issuer domain, the identity digest, and both provider IDs. For
canonical USDC, Circle's official contract-address documentation binds Circle
to Ethereum USDC at `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`.

## Challenge reassessment

Every current-version `OPEN` challenge is snapshotted and individually
adjudicated. The evaluator receives the verified identity, target version,
category, reason, evidence URL, and independently fetched evidence. Evidence is
untrusted data and the reason is an untrusted claim; the fixed category rubric
cannot be changed by either.

Each resolved record retains `evaluation_status`, `evaluation_result`,
`evaluation_reason_code`, `evidence_digest`, and `resolution_version`.
`SUPPORTED`, `NOT_SUPPORTED`, and `INSUFFICIENT_EVIDENCE` are substantive
results. Network, validator-consensus, and malformed-output failures remain
transient/system failures and abort reassessment.

Only after all eligible challenges succeed does V5 create the next Passport.
The Passport stores a deterministic `challenge_set_digest`, count, and
supported-count; the complete individual records remain available through
`challenge_records()`. A supported finding can only escalate risk. A failed
reassessment leaves the previous Passport and every challenge unchanged.

## Changes after steward review

V4 accepted independently supplied chain, token address, market IDs, symbol,
and semantic URLs after syntax checks. It did not bind the address to either
market identity or to issuer authority. V4 could therefore store a syntactically
valid unrelated token with USDC IDs and Circle URLs.

V4 reassessment selected the first open challenge's evidence URL, omitted its
category and reason from evaluation, did not evaluate later open challenges,
and nevertheless marked all open challenges resolved. V5 replaces that behavior
with address-bound identity consensus and atomic, category-aware evaluation of
every current-version open challenge.
