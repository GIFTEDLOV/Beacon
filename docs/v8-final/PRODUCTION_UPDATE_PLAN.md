# Production update record

Status: completed.

The Beacon V8 frontend is published at
`https://beacon-rho-brown.vercel.app` and is configured for the live-proven
GenLayer Studionet deployment:

- Network: Studionet
- Chain ID: `61999`
- Contract: `0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1`
- Frozen contract source SHA-256:
  `698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c`

The final publication sequence was completed: the audited V8 release was
published to GitHub `main`, frontend tests/typecheck/build passed, production
was deployed and promoted on Vercel, and read-only production smoke checks
confirmed the app shell, `/proof`, compiled active configuration, canonical
USDC identity, both provider bindings, Passport V2, and both resolved V2
challenge records.

The frontend never reconstructs Passport risk state. Every write preconditions,
signs once, persists and reconciles the same GenLayer transaction ID, requires
`FINALIZED` plus `FINISHED_WITH_RETURN`, and reads authoritative contract state
before the next action.

Historical pre-publication deployment notes remain in Git history; this file is
the current production record.
