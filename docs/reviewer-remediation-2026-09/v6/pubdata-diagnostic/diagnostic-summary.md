# Beacon V6 Bradbury pubdata diagnostic

The frozen V6 source is 58,020 bytes and produces 58,276 bytes of outer
deployment calldata through the pinned GenLayer CLI/SDK deployment encoding.
The raw Bradbury response is HTTP 200 with JSON-RPC error `-32603`:
`invalid transaction: BlockPubdataLimitReached`. No nested data field or
protocol maximum was exposed.

The identical read-only estimate request succeeds for V4 at 43,364 calldata
bytes and V5 at 52,580 bytes. Three additional estimate rounds across changing
Bradbury blocks reproduced the same V4/V5 success and V6 failure. This proves
the practical release blocker is payload size at the current chain-layer
pubdata boundary, not a fee configuration or a transient block-only condition
in the tested windows. An undocumented exact maximum is not claimed.

The reviewed compact V6 source is 49,301 source bytes and 49,540 calldata
bytes. It passes the complete V6 and repository test suites, GenVM
lint/validation, and the same Bradbury estimate-only path (`0x2595d46`,
39,411,014 gas). It is the canonical pre-deployment release candidate; it has
not been deployed.

The prior failed deployment evidence remains under `deployment/`; this folder
adds only read-only diagnostic records and the untracked experiment.
