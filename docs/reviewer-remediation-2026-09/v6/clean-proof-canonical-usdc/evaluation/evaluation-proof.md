# Beacon V6 canonical USDC evaluation proof

The asset precondition passed and `evaluate_asset` was broadcast exactly once:

- Transaction: `0x6346bc9e2a243bf4b5f7e0b2ac9a22a365f4e14121422bea30f378db8f3fbc95`
- Asset: `eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`

The transaction remained `ACCEPTED` (code 5) after the read-only reconciliation
window. Its execution result was `FINISHED_WITH_RETURN` / `AGREE`, but exposed
validator outcomes were mixed: one `DETERMINISTIC_VIOLATION`, one `TIMEOUT`,
and three `AGREE`, with mismatched result hashes.

Because `FINALIZED` was not observed, no asset/passport readback was performed
and no identity or semantic proof is claimed. No replacement evaluation was
broadcast.
