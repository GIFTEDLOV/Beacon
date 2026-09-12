import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SOURCE_RELATIVE = "contracts/beacon_v8_studionet.py";
const SOURCE_PATH = path.join(ROOT, SOURCE_RELATIVE);
const FREEZE_PATH = path.join(ROOT, "deploy", "v8", "FROZEN_SHA256SUMS.txt");
const PROFILE_PATH = path.join(ROOT, "deploy", "v8", "fee-profile.json");
const STATE_PATH = path.join(ROOT, "deploy", "v8", "deployment-state.json");
const RPC = "https://studio.genlayer.com/api";
const CHAIN_ID = 61999;
type DeploymentState = { txId?: string; sourcePath?: string; sourceSha256?: string; [key: string]: unknown };

function fail(message: string): never {
  throw new Error(message);
}

function frozenSha(): string {
  const text = readFileSync(FREEZE_PATH, "utf8");
  const match = text.match(/^V8_CONTRACT_SHA256\s*=\s*([0-9a-f]{64})\s*$/im);
  return match?.[1]?.toLowerCase() || fail(`Missing frozen V8 SHA in ${FREEZE_PATH}`);
}

function verifyStableProfile(): void {
  const profile = JSON.parse(readFileSync(PROFILE_PATH, "utf8")) as Record<string, any>;
  if (profile.network !== "studionet" || profile.chainId !== CHAIN_ID || profile.rpc !== RPC) {
    fail(`Fee profile is not the frozen Studionet profile: ${PROFILE_PATH}`);
  }
  if (profile.feeMode !== "gasless_or_network_default") fail("Studionet deployment requires the recorded gasless/network-default fee mode.");
}

function persist(state: Record<string, unknown>): void {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function priorSubmission(): DeploymentState | null {
  try {
    const state = JSON.parse(readFileSync(STATE_PATH, "utf8")) as DeploymentState;
    return typeof state?.txId === "string" && state.txId ? state : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    fail(`Cannot read persisted deployment state: ${STATE_PATH}`);
  }
}

function statusName(receipt: any): string {
  return String(receipt?.statusName ?? receipt?.status_name ?? receipt?.status ?? "").toUpperCase();
}

function executionName(receipt: any): string {
  return String(receipt?.txExecutionResultName ?? receipt?.tx_execution_result_name ?? receipt?.execution_result ?? "").toUpperCase();
}

function contractAddress(receipt: any): string {
  return receipt?.data?.contract_address ?? receipt?.txDataDecoded?.contractAddress ?? receipt?.tx_data_decoded?.contract_address ?? "";
}

async function reconcile(client: any, txId: string, sourceSha256: string): Promise<void> {
  const receipt = await client.waitForTransactionReceipt({ hash: txId, status: "FINALIZED", interval: 5000, retries: 200 });
  const status = statusName(receipt);
  const execution = executionName(receipt);
  if (status !== "FINALIZED" || execution !== "FINISHED_WITH_RETURN") {
    fail(`Deployment did not finalize with successful execution for ${txId}: ${JSON.stringify({ status, execution })}`);
  }
  const address = contractAddress(receipt);
  if (!address) fail(`Deployment finalized without a contract address for ${txId}.`);
  persist({ txId, contractAddress: address, sourcePath: SOURCE_RELATIVE, sourceSha256, status, execution, finalizedAt: new Date().toISOString(), network: "Studionet", chainId: CHAIN_ID });
  console.log(JSON.stringify({ txId, contractAddress: address, sourceSha256, status, execution, network: "Studionet", chainId: CHAIN_ID }));
}

export default async function main(): Promise<void> {
  const code = new Uint8Array(readFileSync(SOURCE_PATH));
  const actualSha = createHash("sha256").update(code).digest("hex");
  const expectedSha = frozenSha();
  if (actualSha !== expectedSha) fail(`V8 source SHA mismatch before submission: expected ${expectedSha}, got ${actualSha}`);
  verifyStableProfile();

  const prior = priorSubmission();
  if (prior) {
    if (prior.sourcePath !== SOURCE_RELATIVE || prior.sourceSha256?.toLowerCase() !== actualSha || prior.network !== "Studionet" || prior.chainId !== CHAIN_ID) {
      fail("Persisted deployment state does not match the frozen Studionet V8 source and network.");
    }
    await reconcile(createClient({ chain: studionet, endpoint: RPC }), prior.txId!, actualSha);
    return;
  }

  const privateKey = process.env.GENLAYER_PRIVATE_KEY;
  if (!privateKey) fail("GENLAYER_PRIVATE_KEY is required; no secret was read from disk or printed.");
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) fail("GENLAYER_PRIVATE_KEY has an invalid shape.");

  const account = createAccount(privateKey as `0x${string}`);
  const client = createClient({ chain: studionet, endpoint: RPC, account });
  const txId = await client.deployContract({ code, args: [] });

  // Persist the protocol transaction ID before polling or any further action.
  persist({ txId, sourcePath: SOURCE_RELATIVE, sourceSha256: actualSha, submittedAt: new Date().toISOString(), network: "Studionet", chainId: CHAIN_ID });
  console.log(`STUDIONET_DEPLOY_TX_ID ${txId}`);
  await reconcile(client, txId, actualSha);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) await main();
