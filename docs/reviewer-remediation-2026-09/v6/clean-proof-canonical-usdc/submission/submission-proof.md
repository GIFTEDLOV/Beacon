# Beacon V6 canonical USDC submission proof

The fresh V6 deployment was verified empty before the single submission.
`submit_asset` was broadcast exactly once with a fee of exactly `1 GEN`.

- Transaction: `0x0b71b38fe2d154472c99d5a3ef8bab816321e7384e7c46c4fd5ef416cdd97406`
- Asset ID: `eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- Status at reconciliation end: `ACCEPTED` (5)
- Execution: `FINISHED_WITH_RETURN` / `AGREE`
- Validators: 5 committed, 5 revealed, all `AGREE`

Bradbury did not expose `FINALIZED` during the read-only reconciliation
window. Consequently the submitted asset was not read back and no evaluation
was attempted. No replacement submission was broadcast.
