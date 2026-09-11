import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createAccount, createClient, isSuccessful } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SOURCE_PATH = path.join(ROOT, "contracts", "beacon_v8.py");
const FREEZE_PATH = path.join(ROOT, "deploy", "v8", "FROZEN_SHA256SUMS.txt");
const PROFILE_PATH = process.env.V8_FEE_PROFILE_PATH || path.join(ROOT, "deploy", "v8", "fee-profile.json");
const STATE_PATH = path.join(ROOT, "deploy", "v8", "deployment-state.json");
const RPC = process.env.GENLAYER_RPC_URL || "https://rpc-bradbury.genlayer.com";

function fail(message: string): never {
  throw new Error(message);
}

function frozenSha(): string {
  const text = readFileSync(FREEZE_PATH, "utf8");
  const match = text.match(/^V8_CONTRACT_SHA256\s*=\s*([0-9a-f]{64})\s*$/im);
  return match?.[1]?.toLowerCase() || fail(`Missing frozen V8 SHA in ${FREEZE_PATH}`);
}

function readFeeProfile(): { deploy?: { fees?: Record<string, unknown>; distribution?: unknown; feeValue?: unknown } } {
  const parsed = JSON.parse(readFileSync(PROFILE_PATH, "utf8")) as { deploy?: { fees?: Record<string, unknown>; distribution?: unknown; feeValue?: unknown } };
  if (parsed?.deploy === undefined) fail(`Fee profile has no deploy entry: ${PROFILE_PATH}`);
  return parsed;
}

function deploymentFees(profile: NonNullable<ReturnType<typeof readFeeProfile>["deploy"]>): Record<string, unknown> {
  const fees = profile.fees || profile;
  if (!fees || typeof fees !== "object" || !("distribution" in fees) || !("feeValue" in fees)) {
    fail("Deploy fee profile must contain the exact estimator-returned distribution and feeValue.");
  }
  return fees as Record<string, unknown>;
}

function persist(state: Record<string, unknown>): void {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export default async function main(): Promise<void> {
  const code = new Uint8Array(readFileSync(SOURCE_PATH));
  const actualSha = createHash("sha256").update(code).digest("hex");
  const expectedSha = frozenSha();
  if (actualSha !== expectedSha) fail(`V8 source SHA mismatch before submission: expected ${expectedSha}, got ${actualSha}`);

  const profile = readFeeProfile();
  const fees = deploymentFees(profile.deploy!);
  const privateKey = process.env.GENLAYER_PRIVATE_KEY;
  if (!privateKey) fail("GENLAYER_PRIVATE_KEY is required for this non-interactive deployment path; no secret was read from disk or printed.");
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) fail("GENLAYER_PRIVATE_KEY has an invalid shape.");

  const account = createAccount(privateKey as `0x${string}`);
  const client = createClient({ chain: testnetBradbury, endpoint: RPC, account });
  const txId = await client.deployContract({ code, args: [], fees: fees as never });

  // Persist the protocol transaction ID before polling or any further action.
  persist({ txId, sourcePath: "contracts/beacon_v8.py", sourceSha256: actualSha, submittedAt: new Date().toISOString(), network: "Bradbury", chainId: 4221 });

  const receipt = await client.waitForFinalization({ hash: txId, fullTransaction: true });
  const status = String((receipt as any).statusName ?? (receipt as any).status_name ?? (receipt as any).status ?? "").toUpperCase();
  if (status !== "FINALIZED" || !isSuccessful(receipt)) fail(`Deployment did not finalize successfully for ${txId}.`);
  const address = (receipt as any).data?.contract_address ?? (receipt as any).txDataDecoded?.contractAddress;
  if (!address) fail(`Deployment finalized without a contract address for ${txId}.`);
  persist({ txId, contractAddress: address, sourcePath: "contracts/beacon_v8.py", sourceSha256: actualSha, status, execution: (receipt as any).txExecutionResultName ?? "FINISHED_WITH_RETURN", finalizedAt: new Date().toISOString(), network: "Bradbury", chainId: 4221 });
  console.log(JSON.stringify({ txId, contractAddress: address, sourceSha256: actualSha, status, execution: (receipt as any).txExecutionResultName ?? "FINISHED_WITH_RETURN" }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) await main();
