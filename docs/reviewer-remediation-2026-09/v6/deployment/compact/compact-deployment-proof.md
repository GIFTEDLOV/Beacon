# Beacon V6 compact deployment attempt

- Approved commit: `a8a13da99030771e3530e35eb28b9083c94ea847`
- Source: `contracts/beacon_v6.py`
- Source bytes: `49301`
- Source SHA-256: `caf91af1184168f7ff2d14cafabc8afdbccefb15f69af94b789f8bf9b9af5a4c`
- Network: GenLayer Testnet Bradbury, chain ID `4221`
- Transaction hash: `0x2f0f54cc8a987fb3b71d74c741914dc69adfeb498534550fa84a6c4c73349e92`
- Returned contract address: `0x1b1c54A6a098015736f26C6629ae7d62aC765FB4`
- Broadcast attempts in this phase: `1`

The deployment was accepted by consensus with `AGREE` and
`FINISHED_WITH_RETURN`. Five validators committed and revealed `AGREE`, and
the transaction payload decoded to 49301 bytes with the approved source
SHA-256.

Repeated read-only transaction polling continued to report status code `5`
(`ACCEPTED`), not code `7` (`FINALIZED`). The contract address was readable;
read-only state calls returned `asset_count() == 0`, `asset_ids() == []`, and
`assets() == {}`. The remaining requested deployment proof is therefore
blocked on Bradbury finalization status, not on source parity or contract
readability.

No second broadcast, replacement, finalize transaction, asset submission,
evaluation, challenge, or reassessment was attempted.

Evidence files in this directory preserve the preflight, fresh estimate,
returned hash, terminal accepted transaction data, validator evidence, source
binding, post-broadcast nonce check, and read-only contract readback.
