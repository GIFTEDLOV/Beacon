# Beacon V8 deployment

`deploy.ts` is the only Beacon V8 deployment entry point. It reads exactly
`contracts/beacon_v8.py`, verifies its SHA-256 against
`FROZEN_SHA256SUMS.txt` before submission, consumes the exact fee object from a
real `fee-profile.json`, persists the returned protocol transaction ID before
polling, and accepts success only at `FINALIZED` with
`FINISHED_WITH_RETURN`.

It uses the official `genlayer-js` high-level Bradbury client. It does not use
`deploy/deployScript.ts`, which remains historical and points at V5.

Required environment values are `GENLAYER_PRIVATE_KEY` (never print it), and
optionally `GENLAYER_RPC_URL` and `V8_FEE_PROFILE_PATH`.
