# Beacon V6 proof #3 read-only preflight

- Network: GenLayer Testnet Bradbury, chain ID 4221
- Contract: `0xE3706dc54B2Ca0a33941753Bc214f95670Fee7Fb`
- Asset: `eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- Current version: `1`
- Current verdict: `REJECT`
- Identity: `VERIFIED`
- Existing open challenges: `0`
- Existing challenge-set digest: `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`

The selected set is exactly three distinct categories: REDEMPTION, BACKING,
and GOVERNANCE. Each source was fetched read-only and passed the current V6
`_challenge_evidence` binding checks: HTTPS, same final host, bounded body,
USDC identity, Ethereum signal, exact canonical address, and category role
term. No challenge transaction or reassessment was broadcast.

The active challenger has `1.475596462295218794 GEN`. Three challenge fees are
`0.75 GEN`, leaving `0.725596462295218794 GEN` before gas. Latest and pending
nonce are both `0x12f`; the RPC does not expose `txpool_content`, so the
no-unknown-pending conclusion is based on equal latest/pending nonce and the
absence of any locally identified pending transaction.
