export class LifecycleError extends Error {
  constructor(phase, message, hash = null) {
    super(message);
    this.name = "LifecycleError";
    this.phase = phase;
    this.hash = hash;
  }
}

export function isFinalizedSuccessful(receipt) {
  const status = String(receipt?.status_name ?? receipt?.status ?? "").toUpperCase();
  const leaderReceipts = receipt?.consensus_data?.leader_receipt;
  const leader = Array.isArray(leaderReceipts) ? leaderReceipts[0] : leaderReceipts;
  const execution = String(
    receipt?.execution_result ?? leader?.execution_result ?? receipt?.data?.execution_result ?? "",
  ).toUpperCase();
  return status === "FINALIZED" && execution === "SUCCESS";
}

export async function executeWriteLifecycle({
  readPrecondition,
  broadcast,
  persistHash,
  reconcile,
  readExpectedState,
}) {
  await readPrecondition();
  let hash;
  try {
    hash = await broadcast();
  } catch (error) {
    throw new LifecycleError("broadcast", error?.message || "Broadcast failed; retry only after manual review.");
  }
  if (!hash) throw new LifecycleError("broadcast", "Broadcast returned no transaction hash.");
  try {
    await persistHash(hash);
  } catch (error) {
    throw new LifecycleError("persist", error?.message || "Could not persist transaction hash.", hash);
  }
  let receipt;
  try {
    receipt = await reconcile(hash);
  } catch (error) {
    throw new LifecycleError("reconcile", error?.message || "Receipt reconciliation failed.", hash);
  }
  if (!isFinalizedSuccessful(receipt)) {
    throw new LifecycleError("finality", "Transaction was not finalized with successful contract execution.", hash);
  }
  return { hash, receipt, state: await readExpectedState() };
}

export async function reconcilePersistedWrite({ getPersistedHash, reconcile, readExpectedState }) {
  const hash = await getPersistedHash();
  if (!hash) throw new LifecycleError("recovery", "No persisted transaction hash is available.");
  let receipt;
  try {
    receipt = await reconcile(hash);
  } catch (error) {
    throw new LifecycleError("reconcile", error?.message || "Receipt reconciliation failed.", hash);
  }
  if (!isFinalizedSuccessful(receipt)) {
    throw new LifecycleError("finality", "Persisted transaction is not finalized and successful.", hash);
  }
  return { hash, receipt, state: await readExpectedState() };
}
