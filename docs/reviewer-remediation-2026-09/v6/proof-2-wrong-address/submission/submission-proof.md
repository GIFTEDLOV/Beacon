# Beacon V6 wrong-address USDC-claims submission

The deliberately mismatched asset used Ethereum token address
`0x2222222222222222222222222222222222222222` with USDC claims and was absent at
preflight. It was submitted exactly once with a fee of `1 GEN`.

- Transaction: `0x8873ebe0d4cefde82ced3870e317935e4be6eeb91f2967e44403eb46951074af`
- Asset ID: `eip155:1:0x2222222222222222222222222222222222222222`
- Status: `ACCEPTED` (code 5)
- Execution: `FINISHED_WITH_RETURN` / `AGREE`
- Validators: 5 committed, 5 revealed, all `AGREE`

Bradbury did not expose `FINALIZED` during reconciliation. The asset was not
read back and was not evaluated. No replacement submission was broadcast.
