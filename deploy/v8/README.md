# Beacon V8 deployment

`deploy/v8/deploy.ts` is the only active Beacon deployment entry point. It reads
exactly `contracts/beacon_v8_studionet.py`, verifies its SHA-256 against
`FROZEN_SHA256SUMS.txt`, uses the built-in `studionet` chain definition, and
persists the returned GenLayer transaction ID before polling.

It uses the official stable `genlayer-js` 1.1.8 high-level Studionet client.
Studionet applies network-default fee behavior, so the deployment call passes
no RC-only fee object. The root `deploy/deployScript.ts` is a guarded wrapper
with the same source, network, profile, and freeze checks; the disabled
historical runner cannot submit.

The RPC, chain, source path, source hash, and profile mode are fixed in the
script so environment variables cannot silently select an older source or
another network. If a transaction state file already exists, the script
reconciles that same ID and never rebroadcasts it. The only required secret is
`GENLAYER_PRIVATE_KEY`; it is never printed.
