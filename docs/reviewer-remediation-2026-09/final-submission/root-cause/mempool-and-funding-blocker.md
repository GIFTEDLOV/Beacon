# Bradbury signer quarantine and funding preflight

Date: 2026-09-09

This read-only reconciliation was performed before any final deployment write.

## Quarantined signer

The old deployer `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` is quarantined.
Its latest/pending nonce views are inconsistent (`344/346`), so no further
transaction is sent from it. The known nonce-344 and earlier deployment hashes
had no transaction or receipt on either official Bradbury RPC. The nonce-345
deployment and same-nonce cancellation/replacement were visible without
receipts and created no protocol transaction or contract.

The replacement deployment hashes tried from other previously configured
accounts were also reconciled on both RPCs and had no receipts or protocol
IDs:

- provider nonce 8: `0x303142259c5cc11e5816ab53178732caed8262a506434be8332ae64334fdb66d`
- provider nonce 8 replacement: `0xd239b6db36d92739828640b830af3a00530acde44ba02d3bebb8dec88387a85f`
- player3 nonce 170: `0x5b898a96c9c7799e95ed2ac187e9163221f8a4e14381695753326f5da45ac99f`
- player3 nonce 170 replacement: `0x9827f94eeed3fc19ba065f683e523b88cc11d5ca4b48fac9eb6e3e0e1a2f04ec`

No orphaned contract was found from these attempts.

## Clean signer selection

Both official RPC surfaces were queried:

- GenLayer RPC: `https://rpc-bradbury.genlayer.com`
- Direct chain RPC: `https://rpc.testnet-chain.genlayer.com`

`player2`, address `0x6311dE989ab01Ae4Da77d36CC45d495fbCd4B7a8`, is the only
configured account with matching latest/pending nonce views on both surfaces:

- balance: `1.563384518537238496 GEN`
- latest nonce: `29`
- pending nonce: `29`
- latest block: `21231988` (direct surface observation)
- gas price used for this calculation: `187500000 wei`

Provider had a cross-RPC pending mismatch (`8/9` on one surface), and player3
had a cross-RPC pending mismatch (`170/171` on one surface); neither is clean
under the one-write-in-flight rule.

## Complete-run budget

Fresh read-only estimates for the current source and the complete staged
application sequence returned:

- deployment manual gas: `62,420,481`
- staged proof manual gas: `20,218,983`
- finalization maintenance reserve: `1,500,000`
- total reserved gas: `84,139,464`
- gas cost at `187500000 wei`: `0.015776149500000000 GEN`
- required application fees: `1.500000000000000000 GEN`
- safety reserve: `0.150000000000000000 GEN`
- minimum required balance: `1.665776149500000000 GEN`
- exact shortfall: `0.102391630962761504 GEN`

The official Bradbury faucet is `https://testnet-faucet.genlayer.foundation/`.
It requires interactive GitHub sign-in in this environment, and no browser or
other funded synchronized signer is available. No funding or application write
was sent in this preflight.

## Candidate and tooling

- source SHA256: `45ac294a11321200ace5e3d26798da7f00646ccb4e04bf6c6616ffb38a619468`
- source bytes: `52187`
- serialized deployment bytes: `52195`
- calldata bytes: `52452`
- latest read-only deployment estimate: `41613654` gas; explicit 1.5x limit
  `62420481`; block gas limit `100000000`

The source fix and dual-RPC signer tooling passed local tests and were not
broadcast from the quarantined signer. The final chain proof remains pending
only the funding shortfall above.
