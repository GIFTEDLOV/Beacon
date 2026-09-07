# Beacon V6 fresh clean-proof deployment

- Approved commit: `a8a13da99030771e3530e35eb28b9083c94ea847`
- Source: `contracts/beacon_v6.py`
- Source bytes: `49301`
- Source SHA-256: `caf91af1184168f7ff2d14cafabc8afdbccefb15f69af94b789f8bf9b9af5a4c`
- Network: GenLayer Testnet Bradbury, chain ID `4221`
- Deployment hash: `0x8570b0ba130db3bced04f3947750731c4cdcbddc7deb80e679a8bd1399d46b3a`
- Returned address: `0xE3706dc54B2Ca0a33941753Bc214f95670Fee7Fb`

The exact frozen source was broadcast once after a successful 49,540-byte
calldata estimate. The logical transaction returned `ACCEPTED` (code 5),
`FINISHED_WITH_RETURN` (code 1), and `AGREE`; five validators committed and
revealed `AGREE`, with matching result hashes. The decoded deployment payload
was 49,301 bytes and matched the approved source SHA-256.

The read-only reconciliation window ended without observing `FINALIZED` (code
7). Therefore no post-finalization contract-state readback was attempted and
deployment success is not claimed. No replacement deployment was sent.

The historical V6 deployment and its evidence remain preserved separately.
