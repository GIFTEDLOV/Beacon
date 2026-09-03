export const V4_CONTRACT_ADDRESS = "0xaA0EEB41C30C54104F4106E06acCF4395Ec96b54";
export const V5_CONTRACT_ADDRESS = "0xd52daA517259ca08dF2f4839C0d8962E0A3148c8";
export const BRADBURY_RPC = "https://rpc-bradbury.genlayer.com";

export const V4_RELEASE_PROOF = Object.freeze({
  network: "Testnet Bradbury",
  chainId: 4221,
  contractAddress: V4_CONTRACT_ADDRESS,
  sourceSha256: "5f99961a335247b4b108cdb7a575d356242461fbec411fd10c207018331a809d",
  deploymentTx: "0xc5dacaf4e67b4cb8fec89d6d13677f4bedf636ab7a65cd05290262b3b16cb1a4",
  submitTx: "0x2f70c0b99e9aa3cd3e5edc32359de406e893cc6e5374e4043082b3492414dc47",
  evaluateTx: "0x38d46549976fa719b717dcfb43d8584fe26b1d722639be7c04a66221307270e7",
  validatorSummary: "4 AGREE / 1 DETERMINISTIC_VIOLATION",
  assetId: "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  passportVersion: 1,
  verdict: "REJECT",
  maxLtvBps: 0,
  policyBasis: "MULTIPLE_CRITICAL_UNKNOWN_FIELDS",
});

export const V5_RELEASE_PROOF = Object.freeze({
  network: "Testnet Bradbury",
  chainId: 4221,
  contractAddress: V5_CONTRACT_ADDRESS,
  sourceSha256: "b5077515361badc7c04d792d3f61c331f5d9b1c21edcd7cbc27e4576f80fc3e0",
  sourceBytes: 52329,
  deploymentTx: "0xd96311f0072722af9cfa71e2c1552722bfacb55d19ef58ee7cbf685fd72ec204",
  deploymentStatus: "FINALIZED / FINISHED_WITH_RETURN / AGREE",
  submitTx: "0xecee1abd2cf6b4d29fdf97384737a36811901b2c8642e01b2387eb7c096aa376",
  submitStatus: "FINALIZED / FINISHED_WITH_RETURN / AGREE",
  evaluateTx: "0xca4f1e7d1cc63231dcbe64d8525843f7602004184335aa2f23ffe14796829e7e",
  evaluateStatus: "UNDETERMINED / FINISHED_WITH_RETURN / DISAGREE",
  validatorSummary: "3 TIMEOUT / 14 DETERMINISTIC_VIOLATION",
  assetId: "eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  passportVersion: 0,
  verdict: "NO_PASSPORT",
  maxLtvBps: 0,
  policyBasis: "NO_PASSPORT_AFTER_CONSENSUS_FAILURE",
});
