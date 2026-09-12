# Reviewer response

## Concern 1: authenticated asset and semantic-source binding

V8 roots identity in the canonical namespace and exact token address, not in
display names or provider IDs. For canonical Ethereum USDC the required
witness is:

- namespace: `eip155:1`;
- exact address: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`;
- CoinGecko: `usd-coin`; and
- CoinPaprika: `usdc-usd-coin`.

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
relevance. Local tests cover domain/path, redirect, issuer-address, role,
oversize, and prompt-injection rules.

## Concern 2: complete atomic challenge reassessment

V8 collects every OPEN challenge targeting the current Passport version,
sorts them deterministically, preserves category/reason/stored evidence and
digests, and evaluates each challenge independently from immutable stored
evidence. Reassessment performs zero challenge-evidence web requests. It
stores the new Passport before resolving any challenge and records each
challenge's result, reason code, and resolution version.

The direct two-challenge test proves exactly two OPEN challenges against V1,
zero evidence refetches, V2 creation, two independent populated outcomes, and
both resolutions. A separate failure-in-challenge-two test proves atomic
rollback: no V2 is created and challenge one remains OPEN.

## Live and production proof

The completed multi-validator Studionet proof is on chain `61999` at
`0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1`. Deployment finalized
successfully, canonical USDC reached `VERIFIED`, both provider bindings were
verified, all five semantic roles were verified, Passport V1 was created, and
the exact two-challenge reassessment produced Passport V2 with
`challenge_count = 2`. Both challenge records are independently `RESOLVED /
SUPPORTED / MATERIAL / version 2`.

The frozen contract source is `contracts/beacon_v8_studionet.py`, 44,394 bytes,
SHA-256
`698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c`.
Public GitHub source parity is verified.

Final release validation records `29 passed` contract tests, `21 passed`
frontend tests, frontend typecheck/build PASS, and clean dependency/security
checks. The production application is live at
`https://beacon-rho-brown.vercel.app` and reads the same Studionet contract.
Production smoke checks confirmed the app shell, `/proof`, compiled active
configuration, canonical USDC state, Passport V2, and both resolved challenges.

The read-only verifier and full ledger are in
[`STUDIONET_LIVE_PROOF.md`](STUDIONET_LIVE_PROOF.md). The historical Studio-dev
and Bradbury failures remain documented under their original diagnostic
artifacts and are not used as evidence for this stable Studionet release.
