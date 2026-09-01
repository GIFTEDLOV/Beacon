import assert from "node:assert/strict";
import test from "node:test";

import BeaconRegistry, { CHALLENGE_FEE_WEI, SUBMISSION_FEE_WEI } from "./beacon.js";

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
