# Beacon V8 architecture

Beacon V8 is a small asset-risk Passport contract. Its source of truth is
contract state, not a browser-computed risk score.

## Identity root

The canonical identity is:

`canonical_namespace + ":" + lower(exact token address)`

For the proof asset:

- chain: `ethereum`
- namespace: `eip155:1`
- token: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- asset ID: `eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- CoinGecko ID: `usd-coin`
- CoinPaprika ID: `usdc-usd-coin`

Each provider is checked against the exact address and chain/platform. A
provider ID alone can never establish identity. Both bindings are required
before semantic or market evaluation can proceed.

## Persistent state

The contract uses flat bounded records rather than duplicated snapshots:

- `AssetRecord`: claims, canonical chain/address, provider IDs, lifecycle, and
  current version.
- `IdentityCheckpoint`: provider binding and canonical identity witness.
- `SemanticCheckpoint`: one role-specific authority/binding/result witness for
  ISSUER, REDEMPTION, BACKING, SECURITY, or GOVERNANCE.
- `MarketCheckpoint`: normalized price, peg, liquidity, timestamp, and risks.
- `ChallengeRecord`: target version, category, reason, authenticated bounded
  evidence, digests, evaluation result, reason code, and resolution version.
- `Passport`: only decision-bearing fields, challenge-set provenance, and
  evidence digest; detailed checkpoints remain queryable separately.

## Semantic checkpoints

Each role has one small closed output. The ISSUER source is the exact-address
anchor: it must establish official Circle authority, Ethereum context, USDC
identity, and the exact canonical contract address. The other four Circle
pages do not need to repeat that address; they inherit the already verified
canonical identity while independently proving official authority, asset
context, and role relevance.

Consensus compares normalized consequential facts: role, authority domain,
canonical asset context, binding basis, and the small role result. It does not
compare HTML, Markdown rendering, field order, timestamps, or volatile page
text.

## Market checkpoints and evaluation

CoinGecko and CoinPaprika URLs are contract-controlled. Numbers are parsed to
fixed-point integers, timestamps are bounded for freshness, and provider
disagreement is handled conservatively. Source outage is represented as
unavailable/unknown, not as a negative risk finding.

`evaluate_asset` performs no web requests and no LLM call. It requires both
identity bindings, all five semantic checkpoints, and both market checkpoints,
then deterministically computes `CORE`, `STANDARD`, `WATCH`, or `REJECT` and
`max_ltv_bps`.

## Challenges and reassessment

Challenge evidence is fetched and authenticated once at creation. Only a
bounded normalized evidence excerpt and digest are stored. Reassessment sorts
every OPEN challenge targeting the current Passport version, evaluates each
from immutable stored evidence plus its category/reason/target, and performs
zero evidence web requests. All outcomes are collected before the next
Passport is built. The Passport is stored before challenges are marked
resolved; a failure leaves both the old Passport and all challenges unchanged.

## Frontend and finality

`app/src/services/beacon.js` is the single V8 contract adapter. Reads use an
account-free Bradbury client; writes use the connected wallet through the
current GenLayer JS client and the exact returned fee object. Transaction IDs
are persisted immediately and recovered by tracking the same hash. A write is
successful only when it is `FINALIZED` and execution is
`FINISHED_WITH_RETURN`; `ACCEPTED` is not success.
