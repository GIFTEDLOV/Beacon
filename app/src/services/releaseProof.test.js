import assert from "node:assert/strict";
import test from "node:test";

import {
  BRADBURY_RPC,
  V4_CONTRACT_ADDRESS,
  V4_RELEASE_PROOF,
  V5_CONTRACT_ADDRESS,
  V5_RELEASE_PROOF,
  V6_CONTRACT_ADDRESS,
  V6_RELEASE_PROOF,
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

test("V6 proof binds the live contract, source, identity proofs, and honest reassessment result", () => {
  assert.equal(V6_CONTRACT_ADDRESS, "0xE3706dc54B2Ca0a33941753Bc214f95670Fee7Fb");
  assert.equal(V6_RELEASE_PROOF.contractAddress, V6_CONTRACT_ADDRESS);
  assert.equal(V6_RELEASE_PROOF.sourcePath, "contracts/beacon_v6.py");
  assert.equal(V6_RELEASE_PROOF.sourceCommit, "a8a13da99030771e3530e35eb28b9083c94ea847");
  assert.equal(V6_RELEASE_PROOF.sourceSha256, "caf91af1184168f7ff2d14cafabc8afdbccefb15f69af94b789f8bf9b9af5a4c");
  assert.equal(V6_RELEASE_PROOF.identityStatus, "VERIFIED");
  assert.equal(V6_RELEASE_PROOF.semanticBindingStatus, "ALL FIVE ROLES VERIFIED");
  assert.equal(V6_RELEASE_PROOF.reassessmentStatus, "UNDETERMINED / FINISHED_WITH_RETURN / DISAGREE");
  assert.equal(V6_RELEASE_PROOF.reassessmentValidatorSummary, "12 DETERMINISTIC_VIOLATION / 5 TIMEOUT / 0 AGREE");
});
