# Beacon V6 wrong-address evaluation proof

The wrong-address asset was evaluated exactly once:

- Asset: `eip155:1:0x2222222222222222222222222222222222222222`
- Transaction: `0xa16cfa68208b7c04fbcdb7a86792f7a1b965003229ffa7cd33b7a72f06f5ba84`
- Status: `ACCEPTED` (code 5)
- Execution: `FINISHED_WITH_RETURN` / `AGREE`
- Validators: 5 committed, 5 revealed, all `AGREE`

Bradbury did not expose `FINALIZED` during reconciliation. Therefore the
wrong-address Passport was not read back and no negative identity proof is
claimed yet. No replacement evaluation was broadcast.
