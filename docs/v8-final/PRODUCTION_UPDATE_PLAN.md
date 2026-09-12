# Production update plan

Status: prepared locally; no external production deployment or publication was
performed.

`app/.env.production` now points to the live-proven Studionet V8 contract and
the frontend adapter is pinned to stable genlayer-js 1.1.8. The public site
itself was not changed.

After publication authorization:

1. publish the prepared stable Studionet repository release;
2. build and typecheck the frontend;
3. publish the frontend through the approved production path; and
4. reload the public site and verify reads against the same contract address.

No frontend code may reconstruct Passport risk state. Every write must persist
and reconcile the same GenLayer transaction ID, require `FINALIZED` plus
`FINISHED_WITH_RETURN`, and read final contract state before the next action.
