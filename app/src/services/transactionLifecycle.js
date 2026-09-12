export class LifecycleError extends Error {
  constructor(phase, message, hash = null) {
    super(message);
    this.name = "LifecycleError";
    this.phase = phase;
    this.hash = hash;
  }
}

export function isFinalizedSuccessful(receipt) {
  const status = String(receipt?.statusName ?? receipt?.status_name ?? receipt?.status ?? "").toUpperCase();
  const execution = executionName(receipt);
  return status === "FINALIZED" && execution === "FINISHED_WITH_RETURN";
}

function statusName(receipt) {
  return String(receipt?.statusName ?? receipt?.status_name ?? receipt?.status ?? "").toUpperCase();
}

function executionName(receipt) {
  return String(receipt?.txExecutionResultName ?? receipt?.tx_execution_result_name ?? receipt?.execution_result ?? "").toUpperCase();
}

export async function executeWriteLifecycle({ readPrecondition, broadcast, persistHash, reconcile, readExpectedState, onStatus = null }) {
  await readPrecondition();
  let hash;
  try { hash = await broadcast(); } catch (error) { throw new LifecycleError("broadcast", error?.message || "Broadcast failed; retry only after manual review."); }
  if (!hash) throw new LifecycleError("broadcast", "Broadcast returned no transaction hash.");
  try { await persistHash(hash); } catch (error) { throw new LifecycleError("persist", error?.message || "Could not persist transaction hash.", hash); }
  onStatus?.("SUBMITTED");
  let receipt;
  try { receipt = await reconcile(hash); } catch (error) { throw new LifecycleError("reconcile", error?.message || "Receipt reconciliation failed.", hash); }
  const settledStatus = statusName(receipt);
  if (settledStatus === "ACCEPTED") onStatus?.("ACCEPTED");
  if (settledStatus === "FINALIZED") onStatus?.("FINALIZED");
  const settledExecution = executionName(receipt);
  if (settledExecution === "FINISHED_WITH_RETURN" || settledExecution === "FINISHED_WITH_ERROR") onStatus?.(settledExecution);
  if (!isFinalizedSuccessful(receipt)) throw new LifecycleError("finality", "Transaction was not finalized with FINISHED_WITH_RETURN execution.", hash);
  return { hash, receipt, state: await readExpectedState() };
}

export async function reconcilePersistedWrite({ getPersistedHash, reconcile, readExpectedState, onStatus = null }) {
  const hash = await getPersistedHash();
  if (!hash) throw new LifecycleError("recovery", "No persisted transaction hash is available.");
  let receipt;
  try { receipt = await reconcile(hash); } catch (error) { throw new LifecycleError("reconcile", error?.message || "Receipt reconciliation failed.", hash); }
  const settledStatus = statusName(receipt);
  if (settledStatus === "ACCEPTED") onStatus?.("ACCEPTED");
  if (settledStatus === "FINALIZED") onStatus?.("FINALIZED");
  const settledExecution = executionName(receipt);
  if (settledExecution === "FINISHED_WITH_RETURN" || settledExecution === "FINISHED_WITH_ERROR") onStatus?.(settledExecution);
  if (!isFinalizedSuccessful(receipt)) throw new LifecycleError("finality", "Persisted transaction is not finalized with FINISHED_WITH_RETURN execution.", hash);
  return { hash, receipt, state: await readExpectedState() };
}
