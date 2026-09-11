# Reviewer response

## Concern 1: authenticated asset and semantic-source binding

V8 roots identity in the canonical namespace and exact token address, not in
display names or provider IDs. For canonical Ethereum USDC the required
witness is:

- namespace: `eip155:1`
- exact address: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- CoinGecko: `usd-coin`
- CoinPaprika: `usdc-usd-coin`

Both provider checkpoints independently require the exact address and the
provider-specific chain/platform. Local adversarial tests prove that the real
USDC IDs paired with
`0x2222222222222222222222222222222222222222` remain unverified, and no
semantic evaluation is allowed. Borrowed provider authority is therefore
fail-closed in the contract path.

The ISSUER Circle source is the exact-address anchor and must prove official
issuer authority, Ethereum context, USDC identity, and the exact address. The
REDEMPTION, BACKING, SECURITY, and GOVERNANCE Circle sources do not need to
repeat the address. They inherit the authenticated canonical identity and
independently prove their official authority, correct asset context, and role
relevance. Local tests cover the domain/path, issuer-address, and role-binding
rules.

## Concern 2: complete atomic challenge reassessment

V8 collects every OPEN challenge targeting the current Passport version,
sorts them deterministically, preserves category/reason/stored evidence and
digests, and evaluates each challenge independently from immutable stored
evidence. Reassessment performs zero challenge-evidence web requests. It
stores the new Passport before resolving any challenge and records each
challenge's result, reason code, and resolution version.

The direct two-challenge test proves exactly two OPEN challenges against V1,
zero evidence refetches, V2 creation, two independent populated outcomes, and
both resolutions at version 2. A separate failure-in-challenge-two test proves
atomic rollback: no V2 is created and challenge one remains OPEN.

These are local deterministic/consensus-harness proofs. Studio-dev and
Bradbury live proof remain pending the real fee-profile toolchain prerequisite;
this file does not present local fixtures as live validator evidence.
