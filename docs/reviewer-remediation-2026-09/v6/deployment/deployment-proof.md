# Beacon V6 deployment attempt

- Candidate: `e163482294f4ac5f12807d6a6344e1d7ce445b14`
- Source: `contracts/beacon_v6.py`
- Source SHA-256: `f8a784b27ff3432e7c6d406f1230c73ea9fec1f4d8563cc3f9250e131c0d6d26`
- Source bytes: `58020`
- Network: GenLayer Testnet Bradbury, chain ID `4221`
- Attempt count: `1`

The exact V6 deployment command was executed once. Bradbury rejected gas
estimation with `BlockPubdataLimitReached`; the CLI fell back to default gas,
then `eth_sendRawTransaction` returned `intrinsic gas too low` with identifier
`0x0897eb72a9ae14db4260b14b25152156980a85ecc897b95a1be465d65c806c46`.

That identifier is not a chain transaction: `eth_getTransactionByHash` and
`eth_getTransactionReceipt` both returned `null`, and the deployer latest and
pending nonces remained `284`. The same identifier was reconciled once through
the GenLayer receipt poller, which reported status `0` and no finalized receipt.

No replacement deployment was attempted. No asset lifecycle write was called.
No contract address exists, so deployed-state readback and deployed-source
parity are not applicable.
