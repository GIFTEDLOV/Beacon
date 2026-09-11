# Studio-dev validation

The matching Studio-dev endpoint was checked read-only:

- endpoint: `https://studio-dev.genlayer.com/api`
- observed JSON-RPC chain ID: `0xf22d` (`61997`)
- intended GenLayer chain object: `studioDevnet`

No V8 write was submitted. Therefore there is no truthful Studio-dev contract
address, validator-consensus result, wrong-address transaction, Passport, or
challenge lifecycle to report in this file. The reason is the missing real
fee profile prerequisite, not a fabricated fixture or an alternative chain
route.

The required follow-up is to run the official v0.6-compatible fee-profile
generator, then deploy through the normal high-level GenLayer client and record
the same transaction lifecycle and finalized readbacks here.
