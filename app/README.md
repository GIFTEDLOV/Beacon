# Beacon V8 frontend

This directory contains the production Vue/Vite frontend for Beacon V8.

## Production

- App: `https://beacon-rho-brown.vercel.app`
- GenLayer network: Studionet
- Chain ID: `61999`
- Contract: `0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1`
- Contract source SHA-256:
  `698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c`
- GenLayer SDK: `genlayer-js` `1.1.8`

The frontend reads authoritative state from the live contract. It does not
reconstruct Passport risk state locally. Write flows precondition, sign once,
persist the GenLayer transaction ID, reconcile that same ID, require
`FINALIZED` plus `FINISHED_WITH_RETURN`, and then read contract state.

## Local commands

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

Production configuration is pinned in `.env.production` to the live Beacon V8
Studionet contract. Release-proof constants are centralized in
`src/services/releaseProof.js`.
