import { account, createGenLayerClient } from "./genlayer.js";
import { executeWriteLifecycle, reconcilePersistedWrite } from "./transactionLifecycle.js";
import { V6_CONTRACT_ADDRESS } from "./releaseProof.js";

export const SUBMISSION_FEE_WEI = 1000000000000000000n;
export const CHALLENGE_FEE_WEI = 250000000000000000n;
export const CHALLENGE_CATEGORIES = ["PEG", "LIQUIDITY", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE", "DEPENDENCY", "OTHER"];

function plain(value) {
  if (value instanceof Map) return Object.fromEntries([...value].map(([key, item]) => [key, plain(item)]));
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plain(item)]));
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
  constructor({ address = import.meta.env?.VITE_CONTRACT_ADDRESS, client = null } = {}) {
    this.contractAddress = address || V6_CONTRACT_ADDRESS;
    this.client = client || (this.isConfigured() ? createGenLayerClient(account) : null);
  }

  isConfigured() { return /^0x[0-9a-fA-F]{40}$/.test(this.contractAddress); }
  emptySubmission() {
    return { name: "", symbol: "", chain: "", token_address: "", target_currency: "USD", market_identifier: "", secondary_market_identifier: "", issuer_url: "", redemption_url: "", reserve_backing_url: "", security_url: "", governance_url: "" };
  }
  async read(functionName, args = []) {
    if (!this.isConfigured()) throw new Error("VITE_CONTRACT_ADDRESS is not configured.");
    if (!this.client) throw new Error("GenLayer client is not configured.");
    return plain(await this.client.readContract({ address: this.contractAddress, functionName, args }));
  }
  async asset(id) { return this.read("asset", [id]); }
  async assetIds() { return this.read("asset_ids"); }
  async assetCount() { return this.read("asset_count"); }
  async currentPassport(id) { return this.read("current_passport", [id]); }
  async passportHistory(id) { return this.read("passport_history", [id]); }
  async passportByVersion(id, version) { return this.read("passport_by_version", [id, version]); }
  async challengeRecords(id) { return this.read("challenge_records", [id]); }
  _key(operation, id) { return `beacon.tx.${this.contractAddress}.${operation}.${id || "global"}`; }
  _persist(operation, id, hash) { store()?.setItem(this._key(operation, id), hash); }
  _getPersisted(operation, id) { return store()?.getItem(this._key(operation, id)); }
  _reconcile(hash) { return this.client.waitForTransactionReceipt({ hash, status: "FINALIZED", interval: 1000, retries: 120 }); }
  async _write(operation, id, args, precondition, expected, value = 0n) {
    return executeWriteLifecycle({
      readPrecondition: precondition,
      broadcast: () => this.client.writeContract({ address: this.contractAddress, functionName: operation, args, value }),
      persistHash: async (hash) => this._persist(operation, id, hash),
      reconcile: (hash) => this._reconcile(hash),
      readExpectedState: expected,
    });
  }
  async recover(operation, id, expected) {
    return reconcilePersistedWrite({ getPersistedHash: async () => this._getPersisted(operation, id), reconcile: (hash) => this._reconcile(hash), readExpectedState: expected });
  }
  async submitAsset(fields) {
    const token = fields.token_address.toLowerCase();
    const id = `eip155:1:${token}`;
    const args = [fields.name || "", fields.symbol || "", fields.chain, fields.token_address, fields.target_currency, fields.market_identifier || "", fields.secondary_market_identifier || "", fields.issuer_url, fields.redemption_url, fields.reserve_backing_url, fields.security_url, fields.governance_url];
    return this._write("submit_asset", id, args, async () => {
      const current = await this.asset(id);
      if (current && Object.keys(current).length) throw new Error("Precondition failed: asset already exists.");
    }, () => this.asset(id), SUBMISSION_FEE_WEI);
  }
  async evaluateAsset(id) {
    const canonicalId = selectCanonicalAssetId(id, await this.assetIds());
    return this._write("evaluate_asset", canonicalId, [canonicalId], async () => {
      const current = await this.asset(canonicalId);
      if (!current || Number(current.current_version) !== 0 || current.lifecycle_status !== "SUBMITTED") throw new Error("Precondition failed: asset is not awaiting first evaluation.");
    }, () => this.currentPassport(canonicalId));
  }
  async challengeAsset(id, category, reason, evidenceUrl) {
    const args = [id, 0, category, reason, evidenceUrl];
    return this._write("challenge_asset", id, args, async () => {
      const current = await this.asset(id);
      if (!current || !["CORE", "STANDARD", "WATCH", "REJECT"].includes(current.current_verdict)) throw new Error("Precondition failed: no challengeable current verdict.");
      args[1] = current.current_version;
    }, () => this.asset(id), CHALLENGE_FEE_WEI);
  }
  async reassessAsset(id) {
    let nextVersion = null;
    return this._write("reassess_asset", id, [id], async () => {
      const current = await this.asset(id);
      if (!current || current.lifecycle_status !== "CHALLENGED") throw new Error("Precondition failed: asset is not challenged.");
      nextVersion = Number(current.current_version) + 1;
    }, () => this.currentPassport(id).then((passport) => ({ ...passport, expected_version: nextVersion })));
  }
}
