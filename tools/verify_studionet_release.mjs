import { pathToFileURL } from "node:url";

const RPC = "https://studio.genlayer.com/api";
const CHAIN_ID = 61999;
const CONTRACT = "0x06F2b53C158C6e9a794607d4dB197654eFB3A9b1";
const ASSET_ID = "eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const TOKEN = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const CHALLENGE_SET_DIGEST = "2194f86ae008603696edbd0d01f2d859ec9fa4654d0584fd749153b2cd61ff4d";
const CHALLENGE_A_URL = "https://api.coinpaprika.com/v1/coins/usdc-usd-coin";
const CHALLENGE_B_URL = "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x0fb0e40cec3bb23e13abc585958a93c796fbea56955e19a23727a716a0423239";

const sdkRoot = process.env.BEACON_GENLAYER_JS_ROOT;
const sdk = sdkRoot
  ? await import(pathToFileURL(`${sdkRoot}/dist/index.js`).href)
  : await import("genlayer-js");
const chains = sdkRoot
  ? await import(pathToFileURL(`${sdkRoot}/dist/chains/index.js`).href)
  : await import("genlayer-js/chains");

const client = sdk.createClient({ chain: chains.studionet, endpoint: RPC });
const read = (functionName, args = []) => client.readContract({
  address: CONTRACT,
  functionName,
  args,
  transactionHashVariant: "latest-final",
});
const fail = (message) => {
  throw new Error(message);
};
const nonempty = (value, label) => {
  if (typeof value !== "string" || value.length === 0) fail(`${label} is empty`);
  return value;
};
const requireEqual = (actual, expected, label) => {
  if (actual !== expected) fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

const chainId = client.chain?.id;
requireEqual(chainId, CHAIN_ID, "SDK chain ID");
requireEqual(client.chain?.rpcUrls?.default?.http?.[0], RPC, "SDK RPC");

const assetIds = await read("asset_ids");
if (!Array.isArray(assetIds) || !assetIds.includes(ASSET_ID)) fail("Canonical USDC asset ID is missing");
const asset = await read("asset", [ASSET_ID]);
requireEqual(asset.asset_id, ASSET_ID, "asset.asset_id");
requireEqual(asset.identity_status, "VERIFIED", "asset.identity_status");
requireEqual(asset.canonical_namespace, "eip155:1", "asset.canonical_namespace");
requireEqual(asset.token_address, TOKEN, "asset.token_address");

const checkpoints = await read("checkpoint_state", [ASSET_ID]);
for (const provider of ["COINGECKO", "COINPAPRIKA"]) {
  const checkpoint = checkpoints.identity?.[provider];
  requireEqual(checkpoint?.binding_status, "VERIFIED", `${provider} binding_status`);
  requireEqual(checkpoint?.canonical_token_address, TOKEN, `${provider} canonical_token_address`);
  requireEqual(checkpoint?.asset_id, ASSET_ID, `${provider} asset_id`);
  nonempty(checkpoint?.canonical_fact_digest, `${provider} canonical_fact_digest`);
}
const semanticRoles = ["ISSUER", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE"];
for (const role of semanticRoles) {
  const checkpoint = checkpoints.semantic?.[role];
  requireEqual(checkpoint?.authority_status, "VERIFIED", `${role} authority_status`);
  requireEqual(checkpoint?.asset_binding_status, "VERIFIED", `${role} asset_binding_status`);
  requireEqual(checkpoint?.asset_id, ASSET_ID, `${role} asset_id`);
}
requireEqual(checkpoints.semantic.ISSUER.binding_basis, "EXACT_ADDRESS", "ISSUER binding_basis");
for (const role of semanticRoles.slice(1)) requireEqual(checkpoints.semantic[role].binding_basis, "INHERITED_IDENTITY", `${role} binding_basis`);
requireEqual(checkpoints.market?.COINGECKO?.source_status, "OK", "CoinGecko market source_status");
requireEqual(checkpoints.market?.COINPAPRIKA?.source_status, "OK", "CoinPaprika market source_status");

const passportV1 = await read("passport_by_version", [ASSET_ID, 1]);
const passportV2 = await read("passport_by_version", [ASSET_ID, 2]);
requireEqual(passportV1?.version, 1, "Passport V1 version");
requireEqual(passportV1?.verdict, "CORE", "Passport V1 verdict");
requireEqual(passportV1?.max_ltv_bps, 8000, "Passport V1 max_ltv_bps");
requireEqual(passportV2?.version, 2, "Passport V2 version");
requireEqual(passportV2?.challenge_count, 2, "Passport V2 challenge_count");
requireEqual(passportV2?.challenge_set_digest, CHALLENGE_SET_DIGEST, "Passport V2 challenge_set_digest");

const challengeRecords = await read("challenge_records", [ASSET_ID]);
const challenges = Object.values(challengeRecords ?? {});
const eligible = challenges.filter((record) => record.target_version === 1);
requireEqual(eligible.length, 2, "target-version-1 challenge count");
const challengeA = eligible.find((record) => record.category === "OTHER" && record.evidence_url === CHALLENGE_A_URL);
const challengeB = eligible.find((record) => record.category === "LIQUIDITY" && record.evidence_url === CHALLENGE_B_URL);
if (!challengeA || !challengeB) fail("Expected reviewer challenge A/B records are missing");
for (const [label, challenge] of [["Challenge A", challengeA], ["Challenge B", challengeB]]) {
  requireEqual(challenge.status, "RESOLVED", `${label} status`);
  requireEqual(challenge.evaluation_result, "SUPPORTED", `${label} evaluation_result`);
  requireEqual(challenge.evaluation_reason_code, "MATERIAL", `${label} evaluation_reason_code`);
  requireEqual(challenge.resolution_version, 2, `${label} resolution_version`);
  nonempty(challenge.reason_digest, `${label} reason_digest`);
  nonempty(challenge.evidence_digest, `${label} evidence_digest`);
  nonempty(challenge.bounded_evidence_excerpt, `${label} stored evidence`);
}

const blockNumber = await client.getBlockNumber();
const result = {
  network: "studionet",
  rpc: RPC,
  chainId,
  contract: CONTRACT,
  blockNumber: blockNumber.toString(),
  assetId: ASSET_ID,
  identity: "VERIFIED",
  providerBindings: { COINGECKO: "VERIFIED", COINPAPRIKA: "VERIFIED" },
  semanticRoles: Object.fromEntries(semanticRoles.map((role) => [role, checkpoints.semantic[role].binding_basis])),
  passportV1: { version: 1, verdict: passportV1.verdict, maxLtvBps: passportV1.max_ltv_bps },
  passportV2: { version: 2, challengeCount: passportV2.challenge_count, challengeSetDigest: passportV2.challenge_set_digest },
  challenges: {
    count: 2,
    A: { status: challengeA.status, result: challengeA.evaluation_result, reasonCode: challengeA.evaluation_reason_code, resolutionVersion: challengeA.resolution_version },
    B: { status: challengeB.status, result: challengeB.evaluation_result, reasonCode: challengeB.evaluation_reason_code, resolutionVersion: challengeB.resolution_version },
  },
};
console.log(JSON.stringify(result, null, 2));
