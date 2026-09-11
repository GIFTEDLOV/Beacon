# Bradbury deployment

No V8 Bradbury deployment was attempted.

The read-only network preflight observed chain ID `0x107d` (`4221`) from
`https://rpc-bradbury.genlayer.com` and current block `0x146248c`. The
official current SDK fee-policy read then reverted at
`messageFeeParamsBudgetFloor()` in the Bradbury fee manager
`0xF205868bf5db79d2162843742D18D0900A9E462a`; Studio-dev's corresponding
fee-policy read succeeded. The V8 deployment entry point is
[`deploy/v8/deploy.ts`](../../deploy/v8/deploy.ts). It:

- reads exactly `contracts/beacon_v8.py`;
- hashes the bytes before touching the deployment path;
- requires the frozen SHA manifest and a real deploy fee profile;
- uses the current high-level GenLayer client;
- persists the returned GenLayer transaction ID immediately;
- resumes the same transaction ID when polling; and
- accepts success only for `FINALIZED` plus `FINISHED_WITH_RETURN`.

Because the fee profile was not generated and Bradbury's official fee-policy
read is reverting, the frozen manifest was not created and no transaction ID
or V8 contract address exists. Historical V6/V7
deployment records remain under `docs/reviewer-remediation-2026-09/` and are
not V8 evidence.
