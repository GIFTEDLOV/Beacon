# Beacon V6 multi-challenge reassessment proof attempt

- Network: GenLayer Testnet Bradbury (chain ID 4221)
- Contract: 0xE3706dc54B2Ca0a33941753Bc214f95670Fee7Fb
- Asset: eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
- Outer EVM submission: 0x0ca2d940c24e9454b988d2db02572c970eda4b7027f4e0e66a31f5ef4275bd75
- GenLayer protocol transaction: 0xe1aee4247d31a528b22f48ea8a5d2a3a6bd18fdf10956aa9115e6a9f4c63728c

The outer EVM receipt succeeded and emitted the protocol transaction ID in the NewTransaction event. The protocol transaction reached terminal UNDETERMINED (status code 6), not FINALIZED (status code 7).

Validator evidence at terminal state: 17 committed, 17 revealed, 12 DETERMINISTIC_VIOLATION, and 5 TIMEOUT. Aggregate consensus was DISAGREE; result hashes split between two values.

Because FINALIZED was not observed, no Passport or challenge post-state readback was performed and the multi-challenge reassessment proof is not established. No replacement transaction was broadcast.
