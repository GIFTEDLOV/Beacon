export const STUDIONET_RPC = "https://studio.genlayer.com/api";
export const V8_RELEASE_PROOF = Object.freeze({
  network: "GenLayer Studionet",
  chainId: 61999,
  contractAddress: import.meta.env?.VITE_CONTRACT_ADDRESS || "0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1",
  sourcePath: "contracts/beacon_v8_studionet.py",
  sourceSha256: "698d2cec03a52b66944b6ccade26dfe5886af5ae3cb65a735a30ad28568f9d1c",
  deploymentTx: "0xf890b6bada92e8d42f2f8580cbdf10e39b1459d86f4f836425f8e0ab179286fc",
  assetId: "eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  passportVersion: 2,
  verdict: "WATCH",
  maxLtvBps: 2000,
  deploymentStatus: "FINALIZED",
  liveStatus: "FINISHED_WITH_RETURN",
  evaluateStatus: "FINISHED_WITH_RETURN",
  validatorSummary: "MAJORITY_AGREE",
});
