import assert from "node:assert/strict";
import test from "node:test";

import BeaconRegistry, { CHALLENGE_FEE_WEI, selectCanonicalAssetId, SUBMISSION_FEE_WEI } from "./beacon.js";

const address = "0x1111111111111111111111111111111111111111";
const fields = {
  name: "Beacon Dollar", symbol: "BUSD", chain: "ethereum", token_address: address, target_currency: "USD", market_identifier: "beacon-dollar", secondary_market_identifier: "beacon-dollar-secondary",
  issuer_url: "https://issuer.example.com/asset", redemption_url: "https://issuer.example.com/redeem", reserve_backing_url: "https://issuer.example.com/reserves", security_url: "https://issuer.example.com/security", governance_url: "https://issuer.example.com/governance",
};

test("contract service sends exact configured fees and hardened argument shapes", async () => {
  const writes = [];
  let firstAssetRead = true;
  const client = {
    async readContract({ functionName }) {
      if (functionName === "asset" && firstAssetRead) { firstAssetRead = false; return {}; }
      if (functionName === "asset") return { current_version: 1, current_verdict: "CORE", lifecycle_status: "EVALUATED" };
      return { asset_id: "ethereum:0x1111111111111111111111111111111111111111" };
    },
    async writeContract(request) { writes.push(request); return `0x${writes.length}`; },
    async waitForTransactionReceipt() { return { status: "FINALIZED", consensus_data: { leader_receipt: [{ execution_result: "SUCCESS" }] } }; },
  };
  const registry = new BeaconRegistry({ address, client });
  await registry.submitAsset(fields);
  await registry.challengeAsset(`ethereum:${address.toLowerCase()}`, "PEG", "Price evidence diverges", "https://challenger.example/evidence");
  assert.equal(writes[0].value, SUBMISSION_FEE_WEI);
  assert.equal(writes[1].value, CHALLENGE_FEE_WEI);
  assert.deepEqual(writes[1].args.slice(2), ["PEG", "Price evidence diverges", "https://challenger.example/evidence"]);
});

test("canonical asset selection preserves the exact ID returned by Beacon state", () => {
  const canonical = "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  assert.equal(selectCanonicalAssetId(canonical, [canonical]), canonical);
});

test("mixed-case reconstructed asset IDs are rejected before broadcast", () => {
  const canonical = "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  const mixedCase = "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eB48";
  assert.throws(() => selectCanonicalAssetId(mixedCase, [canonical]), /exactly match Beacon state/);
});

test("evaluation uses the canonical asset ID returned by Beacon state", async () => {
  const canonical = "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  const mixedCase = "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eB48";
  const reads = [];
  const writes = [];
  const client = {
    async readContract({ functionName, args }) {
      reads.push({ functionName, args });
      if (functionName === "asset_ids") return [canonical];
      if (functionName === "asset") return { current_version: 0, lifecycle_status: "SUBMITTED" };
      if (functionName === "current_passport") return { version: 1, verdict: "WATCH" };
      return {};
    },
    async writeContract(request) { writes.push(request); return "0xevaluate"; },
    async waitForTransactionReceipt() { return { status: "FINALIZED", consensus_data: { leader_receipt: [{ execution_result: "SUCCESS" }] } }; },
  };
  const registry = new BeaconRegistry({ address, client });

  await registry.evaluateAsset(canonical);

  assert.deepEqual(writes[0].args, [canonical]);
  assert.equal(reads[0].functionName, "asset_ids");
  assert.deepEqual(reads[0].args, []);
});

test("evaluation rejects a mixed-case ID before any write call", async () => {
  const canonical = "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  const mixedCase = "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eB48";
  let writes = 0;
  const client = {
    async readContract({ functionName }) { if (functionName === "asset_ids") return [canonical]; return {}; },
    async writeContract() { writes += 1; return "0xnever"; },
  };
  const registry = new BeaconRegistry({ address, client });

  await assert.rejects(registry.evaluateAsset(mixedCase), /exactly match Beacon state/);
  assert.equal(writes, 0);
});
