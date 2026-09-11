import { createReadClient, createWriteClient } from "./genlayer.js";
import { executeWriteLifecycle, reconcilePersistedWrite } from "./transactionLifecycle.js";

export const SUBMISSION_FEE_WEI = 1000000000000000000n;
export const CHALLENGE_FEE_WEI = 250000000000000000n;
export const CHALLENGE_CATEGORIES = ["PEG", "LIQUIDITY", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE", "OTHER"];
const VERDICTS = ["CORE", "STANDARD", "WATCH", "REJECT"];
const STATUS = { SUBMITTED: "SUBMITTED", CHALLENGED: "CHALLENGED" };

function plain(value) {
  if (value instanceof Map) return Object.fromEntries([...value].map(([key, item]) => [key, plain(item)]));
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plain(item)]));
  return value;
}

function requireShape(functionName, value) {
  const arrayRead = functionName === "asset_ids";
  if (arrayRead ? !Array.isArray(value) : (!value || typeof value !== "object" || Array.isArray(value))) throw new Error(`Beacon returned an invalid ${functionName} response shape.`);
  return value;
}

export function selectCanonicalAssetId(requestedId, storedIds) {
  if (!Array.isArray(storedIds)) throw new Error("Precondition failed: Beacon returned no asset ID list.");
  const canonicalId = storedIds.find((storedId) => storedId === requestedId);
  if (!canonicalId) throw new Error("Precondition failed: asset ID must exactly match Beacon state.");
  return canonicalId;
}

const store = () => (typeof localStorage === "undefined" ? null : localStorage);

export default class BeaconRegistry {
  constructor({ address = import.meta.env?.VITE_CONTRACT_ADDRESS, client = null, readClient = null, writeClient = null } = {}) {
    this.contractAddress = address || "";
    this.readClient = readClient || client || (this.isConfigured() ? createReadClient() : null);
    this.writeClient = writeClient || (client ? client : null);
  }
  isConfigured() { return /^0x[0-9a-fA-F]{40}$/.test(this.contractAddress); }
  emptySubmission() {
    return { name: "", symbol: "", chain: "ethereum", token_address: "", target_currency: "USD", market_identifier: "", secondary_market_identifier: "", issuer_url: "", redemption_url: "", reserve_backing_url: "", security_url: "", governance_url: "" };
  }
  async read(functionName, args = []) {
    if (!this.isConfigured()) throw new Error("VITE_CONTRACT_ADDRESS is not configured for Beacon V8.");
    if (!this.readClient) throw new Error("GenLayer read client is not configured.");
    const value = await this.readClient.readContract({ address: this.contractAddress, functionName, args, transactionHashVariant: "latest-final" });
    return requireShape(functionName, plain(value));
  }
  async asset(id) { return this.decorateAsset(await this.read("asset", [id])); }
  async assetIds() { return this.read("asset_ids"); }
  async assetCount() { return this.read("asset_count"); }
  async currentPassport(id) { return this.read("current_passport", [id]); }
  async passportHistory(id) { return this.read("passport_history", [id]); }
  async passportByVersion(id, version) { return this.read("passport_by_version", [id, version]); }
  async challengeRecords(id) { return this.read("challenge_records", [id]); }
  async checkpointState(id) { return this.read("checkpoint_state", [id]); }
  decorateAsset(asset) {
    if (!asset || typeof asset !== "object" || Object.keys(asset).length === 0) return asset;
    return { ...asset, name: asset.name_claim || asset.canonical_name || "UNNAMED", symbol: asset.symbol_claim || asset.canonical_symbol || "—", chain: asset.canonical_chain || "ethereum", reserve_backing_url: asset.backing_url || asset.reserve_backing_url || "" };
  }
  decoratePassport(passport, checkpoint) {
    const p = { ...passport };
    const asset = checkpoint?.asset || {};
    const identity = checkpoint?.identity || {};
    const semantic = checkpoint?.semantic || {};
    const market = checkpoint?.market || {};
    p.identity_status = asset.identity_status || "UNVERIFIED";
    p.canonical_chain = asset.canonical_chain || "ethereum";
    p.canonical_namespace = asset.canonical_namespace || "eip155:1";
    p.canonical_token_address = asset.token_address || "";
    p.canonical_name = asset.canonical_name || "";
    p.canonical_symbol = asset.canonical_symbol || "";
    p.coingecko_id = asset.coingecko_id_claim || "";
    p.coinpaprika_id = asset.coinpaprika_id_claim || "";
    p.coingecko_binding_status = identity.COINGECKO?.binding_status || "UNVERIFIED";
    p.coinpaprika_binding_status = identity.COINPAPRIKA?.binding_status || "UNVERIFIED";
    for (const [role, label] of [["ISSUER", "issuer"], ["REDEMPTION", "redemption"], ["BACKING", "backing"], ["SECURITY", "security"], ["GOVERNANCE", "governance"]]) {
      p[`${label}_authority_status`] = semantic[role]?.authority_status || "UNVERIFIED";
      p[`${label}_asset_binding_status`] = semantic[role]?.asset_binding_status || "UNVERIFIED";
      p[`${label}_provenance`] = semantic[role]?.binding_basis || "UNKNOWN";
    }
    p.official_issuer_domain = semantic.ISSUER?.authority_status === "VERIFIED" ? "developers.circle.com" : "";
    p.primary_source_status = market.COINGECKO?.source_status || "PENDING";
    p.secondary_source_status = market.COINPAPRIKA?.source_status || "PENDING";
    p.peg_deviation_bps = market.COINGECKO?.peg_deviation_bps ?? null;
    p.secondary_peg_deviation_bps = market.COINPAPRIKA?.peg_deviation_bps ?? null;
    p.market_timestamp = market.COINGECKO?.market_timestamp || market.COINPAPRIKA?.market_timestamp || "";
    p.policy_basis = p.failure_state === "NONE" ? "DETERMINISTIC_RISK_POLICY" : (p.failure_state || "NOT_EVALUATED");
    p.safety_cap = `${p.max_ltv_bps ?? 0} BPS`;
    return p;
  }
  _key(operation, id) { return `beacon.v8.tx.${this.contractAddress}.${operation}.${id || "global"}`; }
  _persist(operation, id, hash) { store()?.setItem(this._key(operation, id), hash); }
  _getPersisted(operation, id) { return store()?.getItem(this._key(operation, id)); }
  _reconcile(hash) { return this.readClient.waitForFinalization({ hash, fullTransaction: true }); }
  async _getWriteClient() { if (!this.writeClient) this.writeClient = await createWriteClient(); return this.writeClient; }
  async _write(operation, id, args, precondition, expected, value = 0n) {
    return executeWriteLifecycle({
      readPrecondition: precondition,
      broadcast: async () => {
        const client = await this._getWriteClient();
        const estimate = await client.estimateTransactionFeesForWrite({ address: this.contractAddress, functionName: operation, args, value });
        const fees = { distribution: estimate.distribution, feeValue: estimate.feeValue };
        if (estimate.messageAllocations) fees.messageAllocations = estimate.messageAllocations;
        return client.writeContract({ address: this.contractAddress, functionName: operation, args, value, fees });
      },
      persistHash: async (hash) => this._persist(operation, id, hash),
      reconcile: (hash) => this._reconcile(hash),
      readExpectedState: expected,
    });
  }
  async recover(operation, id, expected) { return reconcilePersistedWrite({ getPersistedHash: async () => this._getPersisted(operation, id), reconcile: (hash) => this._reconcile(hash), readExpectedState: expected }); }
  async submitAsset(fields) {
    const token = fields.token_address.toLowerCase();
    const id = `eip155:1:${token}`;
    const args = [fields.name || "", fields.symbol || "", fields.chain, fields.token_address, fields.target_currency, fields.coingecko_id_claim || fields.market_identifier || "", fields.coinpaprika_id_claim || fields.secondary_market_identifier || "", fields.issuer_url, fields.redemption_url, fields.reserve_backing_url || fields.backing_url, fields.security_url, fields.governance_url];
    return this._write("submit_asset", id, args, async () => { const current = await this.asset(id); if (current && Object.keys(current).length) throw new Error("Precondition failed: asset already exists."); }, () => this.asset(id), SUBMISSION_FEE_WEI);
  }
  async evaluateAsset(id) {
    const canonicalId = selectCanonicalAssetId(id, await this.assetIds());
    return this._write("evaluate_asset", canonicalId, [canonicalId], async () => {
      const current = await this.asset(canonicalId);
      if (!current || Number(current.current_version) !== 0 || current.lifecycle_status !== STATUS.SUBMITTED) throw new Error("Precondition failed: asset is not awaiting first evaluation.");
      const checkpoints = await this.checkpointState(canonicalId);
      if (checkpoints?.asset?.identity_status !== "VERIFIED") throw new Error("Precondition failed: dual provider identity checkpoints must be VERIFIED.");
      if (!Object.values(checkpoints?.identity || {}).every((x) => x.binding_status === "VERIFIED")) throw new Error("Precondition failed: both provider identity checkpoints must be VERIFIED.");
      if (!("ISSUER" in (checkpoints?.semantic || {})) || !["ISSUER", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE"].every((role) => checkpoints.semantic[role]?.authority_status === "VERIFIED" && checkpoints.semantic[role]?.asset_binding_status === "VERIFIED")) throw new Error("Precondition failed: all five semantic source checkpoints must be VERIFIED.");
      if (checkpoints.market?.COINGECKO?.source_status !== "OK" || checkpoints.market?.COINPAPRIKA?.source_status !== "OK") throw new Error("Precondition failed: both objective market checkpoints must be ready.");
    }, () => this.currentPassport(canonicalId));
  }
  async _checkpointWrite(operation, id, extra = []) {
    const canonicalId = selectCanonicalAssetId(id, await this.assetIds());
    return this._write(operation, canonicalId, [canonicalId, ...extra], async () => {
      const current = await this.asset(canonicalId);
      if (!current || Number(current.current_version) !== 0 || current.lifecycle_status !== STATUS.SUBMITTED) throw new Error("Precondition failed: asset is not awaiting checkpoints.");
    }, () => this.checkpointState(canonicalId));
  }
  async verifyCoingeckoIdentity(id) { return this._checkpointWrite("verify_coingecko_identity", id); }
  async verifyCoinpaprikaIdentity(id) { return this._checkpointWrite("verify_coinpaprika_identity", id); }
  async verifySemanticSource(id, role) {
    const canonicalId = selectCanonicalAssetId(id, await this.assetIds());
    return this._write("verify_semantic_source", canonicalId, [canonicalId, role], async () => {
      const current = await this.asset(canonicalId);
      if (!current || Number(current.current_version) !== 0 || current.identity_status !== "VERIFIED") throw new Error("Precondition failed: dual provider identity checkpoints are incomplete.");
    }, () => this.checkpointState(canonicalId));
  }
  async refreshCoingeckoMarket(id) { return this._checkpointWrite("refresh_coingecko_market", id); }
  async refreshCoinpaprikaMarket(id) { return this._checkpointWrite("refresh_coinpaprika_market", id); }
  async challengeAsset(id, category, reason, evidenceUrl) {
    const current = await this.asset(id);
    if (!current || !VERDICTS.includes(current.current_verdict)) throw new Error("Precondition failed: no challengeable current verdict.");
    const args = [id, Number(current.current_version), category, reason, evidenceUrl];
    return this._write("challenge_asset", id, args, async () => {
      const fresh = await this.asset(id);
      if (!fresh || !VERDICTS.includes(fresh.current_verdict) || Number(fresh.current_version) !== args[1]) throw new Error("Precondition failed: current passport changed; review before retrying.");
    }, () => this.asset(id), CHALLENGE_FEE_WEI);
  }
  async reassessAsset(id) {
    let nextVersion = null;
    return this._write("reassess_asset", id, [id], async () => {
      const current = await this.asset(id);
      if (!current || current.lifecycle_status !== STATUS.CHALLENGED) throw new Error("Precondition failed: asset is not challenged.");
      nextVersion = Number(current.current_version) + 1;
    }, () => this.currentPassport(id).then((passport) => ({ ...passport, expected_version: nextVersion })));
  }
}
