import assert from "node:assert/strict";
import test from "node:test";

import {
  LifecycleError,
  executeWriteLifecycle,
  isFinalizedSuccessful,
  reconcilePersistedWrite,
} from "./transactionLifecycle.js";

const successReceipt = {
  status: "FINALIZED",
  consensus_data: { leader_receipt: [{ execution_result: "SUCCESS" }] },
};

test("accepts only finalized successful execution", () => {
  assert.equal(isFinalizedSuccessful(successReceipt), true);
  assert.equal(isFinalizedSuccessful({ status: "ACCEPTED", execution_result: "SUCCESS" }), false);
  assert.equal(isFinalizedSuccessful({ status: "FINALIZED", execution_result: "REVERT" }), false);
});

test("writes once, persists the hash, reconciles the same hash, then reads state", async () => {
  const events = [];
  let broadcastCount = 0;
  const result = await executeWriteLifecycle({
    readPrecondition: async () => events.push("precondition"),
    broadcast: async () => { broadcastCount += 1; events.push("broadcast"); return "0xabc"; },
    persistHash: async (hash) => events.push(`persist:${hash}`),
    reconcile: async (hash) => { events.push(`reconcile:${hash}`); return successReceipt; },
    readExpectedState: async () => { events.push("expected"); return { version: 1 }; },
  });

  assert.equal(broadcastCount, 1);
  assert.deepEqual(events, ["precondition", "broadcast", "persist:0xabc", "reconcile:0xabc", "expected"]);
  assert.deepEqual(result.state, { version: 1 });
});

test("does not broadcast when the precondition read fails", async () => {
  let broadcastCount = 0;
  await assert.rejects(
    executeWriteLifecycle({
      readPrecondition: async () => { throw new Error("stale state"); },
      broadcast: async () => { broadcastCount += 1; return "0xnever"; },
      persistHash: async () => {},
      reconcile: async () => successReceipt,
      readExpectedState: async () => ({}),
    }),
    /stale state/,
  );
  assert.equal(broadcastCount, 0);
});

test("retains an ambiguous hash and never rebroadcasts after reconciliation failure", async () => {
  let broadcastCount = 0;
  await assert.rejects(
    executeWriteLifecycle({
      readPrecondition: async () => {},
      broadcast: async () => { broadcastCount += 1; return "0xambiguous"; },
      persistHash: async () => {},
      reconcile: async () => { throw new Error("RPC timeout"); },
      readExpectedState: async () => ({}),
    }),
    (error) => error instanceof LifecycleError && error.phase === "reconcile" && error.hash === "0xambiguous",
  );
  assert.equal(broadcastCount, 1);

  let recoveredBroadcastCount = 0;
  const recovered = await reconcilePersistedWrite({
    getPersistedHash: async () => "0xambiguous",
    reconcile: async (hash) => { assert.equal(hash, "0xambiguous"); return successReceipt; },
    readExpectedState: async () => { recoveredBroadcastCount += 1; return { reconciled: true }; },
  });
  assert.equal(recoveredBroadcastCount, 1);
  assert.equal(recovered.hash, "0xambiguous");
});

test("does not read expected state after non-successful finality", async () => {
  let expectedReads = 0;
  await assert.rejects(
    executeWriteLifecycle({
      readPrecondition: async () => {},
      broadcast: async () => "0xrejected",
      persistHash: async () => {},
      reconcile: async () => ({ status: "FINALIZED", execution_result: "REVERT" }),
      readExpectedState: async () => { expectedReads += 1; return {}; },
    }),
    (error) => error instanceof LifecycleError && error.phase === "finality" && error.hash === "0xrejected",
  );
  assert.equal(expectedReads, 0);
});
