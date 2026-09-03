import assert from "node:assert/strict";
import test from "node:test";

import {
  BRADBURY_RPC,
  V4_CONTRACT_ADDRESS,
  V4_RELEASE_PROOF,
  V5_CONTRACT_ADDRESS,
  V5_RELEASE_PROOF,
} from "./releaseProof.js";

test("historical V4 identity remains pinned to its deployed contract", () => {
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

test("V5 proof records exact source parity and the non-consensus evaluation", () => {
  assert.equal(V5_CONTRACT_ADDRESS, "0xd52daA517259ca08dF2f4839C0d8962E0A3148c8");
  assert.equal(V5_RELEASE_PROOF.contractAddress, V5_CONTRACT_ADDRESS);
  assert.equal(V5_RELEASE_PROOF.sourceSha256, "b5077515361badc7c04d792d3f61c331f5d9b1c21edcd7cbc27e4576f80fc3e0");
  assert.equal(V5_RELEASE_PROOF.sourceBytes, 52329);
  assert.equal(V5_RELEASE_PROOF.deploymentStatus, "FINALIZED / FINISHED_WITH_RETURN / AGREE");
  assert.equal(V5_RELEASE_PROOF.submitStatus, "FINALIZED / FINISHED_WITH_RETURN / AGREE");
  assert.equal(V5_RELEASE_PROOF.evaluateStatus, "UNDETERMINED / FINISHED_WITH_RETURN / DISAGREE");
  assert.equal(V5_RELEASE_PROOF.validatorSummary, "3 TIMEOUT / 14 DETERMINISTIC_VIOLATION");
  assert.equal(V5_RELEASE_PROOF.passportVersion, 0);
  assert.equal(V5_RELEASE_PROOF.verdict, "NO_PASSPORT");
});
