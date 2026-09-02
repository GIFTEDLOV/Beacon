import assert from "node:assert/strict";
import test from "node:test";

import { BRADBURY_RPC, V4_CONTRACT_ADDRESS, V4_RELEASE_PROOF } from "./releaseProof.js";

test("production release identity is pinned to the deployed V4 contract", () => {
  assert.equal(V4_CONTRACT_ADDRESS, "0xaA0EEB41C30C54104F4106E06acCF4395Ec96b54");
  assert.equal(V4_RELEASE_PROOF.contractAddress, V4_CONTRACT_ADDRESS);
  assert.equal(V4_RELEASE_PROOF.sourceSha256, "5f99961a335247b4b108cdb7a575d356242461fbec411fd10c207018331a809d");
  assert.equal(BRADBURY_RPC, "https://rpc-bradbury.genlayer.com");
});

test("evaluation proof preserves the non-unanimous validator receipt summary", () => {
  assert.equal(V4_RELEASE_PROOF.validatorSummary, "4 AGREE / 1 DETERMINISTIC_VIOLATION");
  assert.equal(V4_RELEASE_PROOF.verdict, "REJECT");
  assert.equal(V4_RELEASE_PROOF.maxLtvBps, 0);
});
