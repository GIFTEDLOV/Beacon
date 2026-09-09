# Final deployment attempt: player2 cross-RPC reconciliation

Date: 2026-09-09

Signer: `0x6311dE989ab01Ae4Da77d36CC45d495fbCd4B7a8`

Source SHA256: `45ac294a11321200ace5e3d26798da7f00646ccb4e04bf6c6616ffb38a619468`

The signer was rechecked after external funding. Both official Bradbury RPCs
reported chain ID `4221`, balance `2.363384518537238496 GEN`, and confirmed
nonce `29`; the complete-run modeled minimum was
`1.662352466053850250 GEN`.

## Deployment transaction and permitted replacement

The deployment was constructed and signed once at nonce `29`, with identical
raw bytes sent to both official RPCs:

- original: `0x02af4ce4f1f65950bba245a9415bbda14bd9e615452a2bbd5a681d9cfb85da3c`
- gas: `62420481`
- gas price: `152339250 wei`

After bounded receipt observation while blocks advanced, one same-intent,
same-nonce fee replacement was permitted and sent as identical raw bytes to
both RPCs:

- replacement: `0xc0cf75b060251ce4738516d1a5e3a7b510e45ed32b6edb1cfa820f6b53e4767f`
- gas: `62420481`
- gas price: `220000000 wei`

The GenLayer RPC accepted each canonical hash; the direct chain RPC reported
the replacement as already imported. During the bounded wait, each hash
intermittently appeared on one RPC, but neither hash produced an EVM receipt.
At the final read:

- GenLayer RPC: block `0x1440749`, latest/pending `29/29`
- direct chain RPC: block `0x1440749`, latest/pending `29/30`
- receipts: absent for both hashes
- protocol transaction IDs: none
- deployment contract: none

No nonce-30 transaction was sent. No further replacement is authorized or
safe without a changed external mempool state. No later application write was
attempted.
