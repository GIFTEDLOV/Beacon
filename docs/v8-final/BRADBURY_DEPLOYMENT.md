# Bradbury deployment

No V8 Bradbury deployment was attempted. The required read-only health gate
failed before signer inspection or any GEN-spending action.

The fresh preflight observed chain ID `4221` from both
`https://rpc-bradbury.genlayer.com` and
`https://rpc.testnet-chain.genlayer.com`. Bradbury blocks advanced from
`21517405` → `21517418` during the health check; the later read was `21519113`.
The official
current SDK fee-policy read then reverted at
`messageFeeParamsBudgetFloor()` in the Bradbury fee manager
`0xF205868bf5db79d2162843742D18D0900A9E462a`. The official transaction-fee
estimator also failed because `quoteGasPrice()` reverted. The exact errors are
recorded in [`FULL_AUDIT.md`](FULL_AUDIT.md) and
[`BRADBURY_HEALTH.json`](BRADBURY_HEALTH.json).

Captured SDK error heads:

```text
The contract function "messageFeeParamsBudgetFloor" reverted.
Details: execution reverted

The contract function "quoteGasPrice" reverted.
Details: execution reverted
```

The V8 deployment entry point is [`deploy/v8/deploy.ts`](../../deploy/v8/deploy.ts). It:

- reads exactly `contracts/beacon_v8.py`;
- hashes the bytes before touching the deployment path;
- requires the frozen SHA manifest and a real deploy fee profile;
- uses the current high-level GenLayer client;
- persists the returned GenLayer transaction ID immediately;
- resumes the same transaction ID when polling; and
- accepts success only for `FINALIZED` plus `FINISHED_WITH_RETURN`.

The frozen manifest was not created because the live validator and Bradbury
fee gates did not pass. No Bradbury transaction ID or V8 contract address
exists. Historical deployment records remain under
`docs/reviewer-remediation-2026-09/` and are not V8 evidence.
