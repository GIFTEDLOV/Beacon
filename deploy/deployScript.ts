import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SOURCE_RELATIVE = "contracts/beacon_v8_studionet.py";
const SOURCE_PATH = path.join(ROOT, SOURCE_RELATIVE);
const FREEZE_PATH = path.join(ROOT, "deploy", "v8", "FROZEN_SHA256SUMS.txt");
const PROFILE_PATH = path.join(ROOT, "deploy", "v8", "fee-profile.json");
const STATE_PATH = path.join(ROOT, "deploy", "v8", "deployment-state.json");
const RPC = "https://studio.genlayer.com/api";
const CHAIN_ID = 61999;

function frozenSha(): string {
  const text = readFileSync(FREEZE_PATH, "utf8");
  const match = text.match(/^V8_CONTRACT_SHA256\s*=\s*([0-9a-f]{64})\s*$/im);
  if (!match) throw new Error(`Missing frozen V8 SHA in ${FREEZE_PATH}`);
  return match[1].toLowerCase();
}

function assertStableProfile(): void {
  const profile = JSON.parse(readFileSync(PROFILE_PATH, "utf8"));
  if (profile.network !== "studionet" || profile.rpc !== RPC || profile.chainId !== CHAIN_ID || profile.feeMode !== "gasless_or_network_default") {
    throw new Error(`Fee profile is not the frozen Studionet profile: ${PROFILE_PATH}`);
  }
}

function executionName(receipt: any): string {
  return String(receipt?.txExecutionResultName ?? receipt?.tx_execution_result_name ?? receipt?.execution_result ?? "").toUpperCase();
}

export default async function main(client: any) {
  const code = new Uint8Array(readFileSync(SOURCE_PATH));
  const actualSha = createHash("sha256").update(code).digest("hex");
  const expectedSha = frozenSha();
  if (actualSha !== expectedSha) throw new Error(`V8 source SHA mismatch: expected ${expectedSha}, got ${actualSha}`);
  assertStableProfile();

  // genlayer-js 1.1.8's stable Studionet path applies network-default fees;
  // do not add RC-only fee fields to this call.
  const txId = await client.deployContract({ code, args: [] });
  writeFileSync(STATE_PATH, `${JSON.stringify({ txId, sourcePath: SOURCE_RELATIVE, sourceSha256: actualSha, submittedAt: new Date().toISOString(), network: "Studionet", chainId: CHAIN_ID }, null, 2)}\n`, "utf8");
  console.log("STUDIONET_DEPLOY_TX_ID", txId);

  const receipt = await client.waitForTransactionReceipt({ hash: txId, status: "FINALIZED", interval: 5000, retries: 200 });
  const status = String((receipt as any).statusName ?? (receipt as any).status_name ?? (receipt as any).status ?? "").toUpperCase();
  const execution = executionName(receipt);
  if (status !== "FINALIZED" || execution !== "FINISHED_WITH_RETURN") throw new Error(`Deployment did not finish successfully: ${JSON.stringify({ txId, status, execution })}`);
  const address = (receipt as any).data?.contract_address ?? (receipt as any).txDataDecoded?.contractAddress;
  if (!address) throw new Error(`Deployment finalized without a contract address: ${txId}`);
  console.log("STUDIONET_V8_CONTRACT", address);
}
