import assert from "node:assert/strict";
import test from "node:test";

import {
  exactLiveProofState,
  filterRegistry,
  identityDisplayState,
  parseBeaconPath,
  passportDisplayState,
  validateChallengeInput,
  validateSubmissionFields,
} from "./presentation.js";

test("live proof reads never fall back to another asset or static release facts", () => {
  const rows = [
    { asset_id: "other", passport: { asset_id: "other", version: 9, verdict: "CORE" } },
    { asset_id: "target", passport: { asset_id: "target" } },
  ];
  assert.deepEqual(exactLiveProofState(rows, "missing"), { asset: null, passport: null, available: false });
  assert.deepEqual(exactLiveProofState(rows, "target"), { asset: rows[1], passport: null, available: false });
  assert.equal(exactLiveProofState(rows, "other").available, true);
});

const validSubmission = {
  name: "USD Coin", symbol: "USDC", chain: "ethereum", token_address: "0x1111111111111111111111111111111111111111", target_currency: "USD", market_identifier: "beacon-dollar", secondary_market_identifier: "beacon-dollar-secondary",
  issuer_url: "https://developers.circle.com/stablecoins/usdc-contract-addresses.md", redemption_url: "https://developers.circle.com/circle-mint/concepts/how-minting-works.md", reserve_backing_url: "https://developers.circle.com/stablecoins/what-is-usdc.md", security_url: "https://developers.circle.com/cctp/references/technical-guide.md", governance_url: "https://developers.circle.com/xreserve/concepts/usdc-backed-stablecoin-specification.md",
};

test("registry presentation reads live-shaped rows and separates failures", () => {
  const rows = [
    { name: "Core", symbol: "COR", chain: "ethereum", asset_id: "ethereum:core", passport: { verdict: "CORE", failure_state: "NONE" } },
    { name: "Failed", symbol: "BAD", chain: "ethereum", asset_id: "ethereum:failed", passport: { verdict: "REJECT", failure_state: "EVIDENCE_CONFLICT" } },
  ];
  assert.equal(filterRegistry(rows, "core", "CORE").length, 1);
  assert.equal(filterRegistry(rows, "", "EVALUATION_FAILURE").length, 1);
  assert.deepEqual(passportDisplayState(rows[1].passport), { kind: "failure", label: "EVIDENCE_CONFLICT" });
});

test("path parsing supports every public route without hash aliases", () => {
  assert.deepEqual(parseBeaconPath("/"), { name: "landing" });
  assert.deepEqual(parseBeaconPath("/assets"), { name: "registry" });
  assert.deepEqual(parseBeaconPath("/assets/ethereum%3A0xabc"), { name: "detail", assetId: "ethereum:0xabc" });
  assert.deepEqual(parseBeaconPath("/assets/ethereum%3A0xabc/challenge"), { name: "challenge", assetId: "ethereum:0xabc" });
  assert.deepEqual(parseBeaconPath("/submit"), { name: "submit" });
  assert.deepEqual(parseBeaconPath("/proof"), { name: "proof" });
});

test("submission validation catches identity, source and duplicate-role errors", () => {
  assert.deepEqual(validateSubmissionFields(validSubmission), []);
  assert.ok(validateSubmissionFields({ ...validSubmission, chain: "polygon" }, 1).some((message) => message.includes("Ethereum")));
  assert.ok(validateSubmissionFields({ ...validSubmission, secondary_market_identifier: validSubmission.market_identifier }, 2).some((message) => message.includes("independent")));
  assert.ok(validateSubmissionFields({ ...validSubmission, issuer_url: "http://localhost/asset" }, 3).length);
  assert.ok(validateSubmissionFields({ ...validSubmission, governance_url: validSubmission.issuer_url }, 3).some((message) => message.includes("reused")));
});

test("identity presentation distinguishes authenticated fields from submitter claims", () => {
  const verified = identityDisplayState({ identity_status: "VERIFIED", canonical_chain: "ethereum", canonical_namespace: "eip155:1", canonical_token_address: "0xabc", canonical_name: "USDC", canonical_symbol: "USDC", coingecko_id: "usd-coin", coinpaprika_id: "usdc-usd-coin", coingecko_binding_status: "VERIFIED", coinpaprika_binding_status: "VERIFIED" }, { chain: "ethereum", token_address: "0xabc" });
  assert.equal(verified.canonicalChain, "ethereum");
  assert.equal(verified.coingeckoBinding, "VERIFIED");
  const unverified = identityDisplayState({ identity_status: "UNVERIFIED", canonical_chain: "ethereum", canonical_token_address: "0xabc", primary_market_id: "usd-coin" }, { chain: "polygon", token_address: "0xdef" });
  assert.equal(unverified.canonicalChain, "UNVERIFIED");
  assert.equal(unverified.coingeckoId, "UNVERIFIED");
  assert.equal(unverified.submittedChain, "polygon");
});

test("challenge validation rejects unbounded or unsafe inputs", () => {
  assert.deepEqual(validateChallengeInput({ category: "PEG", reason: "Price source diverges", evidence_url: "https://independent.example/evidence" }), []);
  assert.ok(validateChallengeInput({ category: "NOPE", reason: "", evidence_url: "http://localhost/evidence" }).length >= 3);
});
