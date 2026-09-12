import assert from "node:assert/strict";
import test from "node:test";

import { STUDIONET_RPC, V8_RELEASE_PROOF } from "./releaseProof.js";

test("V8 release proof points to the frozen Studionet deployment", () => {
  assert.equal(STUDIONET_RPC, "https://studio.genlayer.com/api");
  assert.equal(V8_RELEASE_PROOF.network, "GenLayer Studionet");
  assert.equal(V8_RELEASE_PROOF.chainId, 61999);
  assert.equal(V8_RELEASE_PROOF.sourcePath, "contracts/beacon_v8_studionet.py");
  assert.equal(V8_RELEASE_PROOF.sourceSha256, "698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c");
  assert.equal(V8_RELEASE_PROOF.deploymentTx, "0xf890b6bada92e8d42f2f8580cbdf10e39b1459d86f4f836425f8e0ab179286fc");
  assert.equal(V8_RELEASE_PROOF.assetId, "eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
  assert.equal(V8_RELEASE_PROOF.deploymentStatus, "FINALIZED");
  assert.equal(V8_RELEASE_PROOF.liveStatus, "FINISHED_WITH_RETURN");
});
