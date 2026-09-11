export const VERDICTS = ["CORE", "STANDARD", "WATCH", "REJECT"];
export const FAILURE_STATES = [
  "ASSET_IDENTITY_UNVERIFIED",
  "ASSET_IDENTITY_CONFLICT",
  "SOURCE_IDENTITY_UNVERIFIED",
  "EVIDENCE_UNAVAILABLE",
  "EVIDENCE_CONFLICT",
  "INSUFFICIENT_EVIDENCE",
  "INVALID_SOURCE",
  "INVALID_SEMANTIC_OUTPUT",
  "CONSENSUS_VALIDATION_FAILURE",
];
export const CHALLENGE_CATEGORIES = ["PEG", "LIQUIDITY", "REDEMPTION", "BACKING", "SECURITY", "GOVERNANCE", "OTHER"];

function isHttpsPublicLooking(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && !host.includes("localhost") && !host.startsWith("127.") && !host.startsWith("10.") && !host.startsWith("192.168.") && !host.startsWith("172.") && !host.startsWith("169.254.") && !host.endsWith(".internal");
  } catch {
    return false;
  }
}

export function validateSubmissionFields(fields, step = 0) {
  const errors = [];
  if (step === 0 || step === 1) {
    if (!/^(eip155:1|ethereum|eth|mainnet)$/i.test(fields.chain || "")) errors.push("Only the recognized Ethereum mainnet chain namespace is supported.");
    if (!/^0x[0-9a-fA-F]{40}$/.test(fields.token_address || "")) errors.push("EVM token address format is invalid.");
    if (fields.name && (!String(fields.name).trim() || fields.name.length > 80)) errors.push("Name is an optional untrusted claim.");
    if (fields.symbol && !/^[A-Za-z0-9]{1,16}$/.test(fields.symbol)) errors.push("Symbol claim must be 1-16 letters or numbers.");
  }
  if (step === 0 || step === 2) {
    if (!/^[A-Za-z][A-Za-z0-9]{2,11}$/.test(fields.target_currency || "")) errors.push("Target currency format is invalid.");
    for (const claim of [fields.market_identifier, fields.secondary_market_identifier]) {
      if (!claim || !/^[a-z0-9][a-z0-9._:-]{1,63}$/i.test(claim)) errors.push("Both authenticated market ID claims are required and must be bounded.");
    }
    if (fields.market_identifier && fields.secondary_market_identifier && fields.market_identifier.toLowerCase() === fields.secondary_market_identifier.toLowerCase()) errors.push("Objective claims must be independent.");
  }
  if (step === 0 || step === 3) {
    const urls = [fields.issuer_url, fields.redemption_url, fields.reserve_backing_url, fields.security_url, fields.governance_url];
    if (urls.some((url) => !url || url.length > 1024 || !isHttpsPublicLooking(url))) errors.push("Every evidence role needs a bounded HTTPS source.");
    const canonical = urls.map((url) => { try { const parsed = new URL(url); return `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}${parsed.search}`; } catch { return url; } });
    if (new Set(canonical).size !== canonical.length) errors.push("Evidence sources must not be reused across roles.");
  }
  return errors;
}

export function validateChallengeInput(fields) {
  const errors = [];
  if (!CHALLENGE_CATEGORIES.includes(fields.category)) errors.push("Choose a valid challenge category.");
  if (!String(fields.reason || "").trim() || String(fields.reason).trim().length > 512) errors.push("Reason must be 1-512 characters.");
  if (!isHttpsPublicLooking(fields.evidence_url || "") || String(fields.evidence_url).length > 1024) errors.push("Challenge evidence must be a bounded HTTPS URL.");
  return errors;
}

export function passportDisplayState(passport) {
  if (!passport || passport.failure_state === "NOT_EVALUATED") return { kind: "pending", label: "NOT EVALUATED" };
  if (passport.failure_state && passport.failure_state !== "NONE") return { kind: "failure", label: passport.failure_state };
  if (VERDICTS.includes(passport.verdict)) return { kind: "verdict", label: passport.verdict };
  return { kind: "pending", label: "UNASSESSED" };
}

export function exactLiveProofState(rows, assetId) {
  const asset = Array.isArray(rows) ? rows.find((row) => row?.asset_id === assetId) || null : null;
  const passport = asset?.passport && typeof asset.passport === "object" && Object.keys(asset.passport).length
    ? asset.passport
    : null;
  const available = Boolean(asset && passport && passport.asset_id === assetId && Object.prototype.hasOwnProperty.call(passport, "version"));
  return { asset, passport: available ? passport : null, available };
}

export function identityDisplayState(passport = {}, asset = {}, checkpoint = {}) {
  const verified = (passport.identity_status || asset.identity_status) === "VERIFIED";
  const identity = checkpoint.identity || {};
  return {
    status: passport.identity_status || asset.identity_status || "UNVERIFIED",
    canonicalChain: verified ? passport.canonical_chain || asset.canonical_chain || "UNVERIFIED" : "UNVERIFIED",
    canonicalNamespace: verified ? passport.canonical_namespace || asset.canonical_namespace || "UNVERIFIED" : "UNVERIFIED",
    canonicalAddress: verified ? passport.canonical_token_address || asset.token_address || "UNVERIFIED" : "UNVERIFIED",
    canonicalName: verified ? passport.canonical_name || asset.canonical_name || "UNVERIFIED" : "UNVERIFIED",
    canonicalSymbol: verified ? passport.canonical_symbol || asset.canonical_symbol || "UNVERIFIED" : "UNVERIFIED",
    coingeckoId: verified ? passport.coingecko_id || asset.coingecko_id_claim || "UNVERIFIED" : "UNVERIFIED",
    coinpaprikaId: verified ? passport.coinpaprika_id || asset.coinpaprika_id_claim || "UNVERIFIED" : "UNVERIFIED",
    coingeckoBinding: verified ? passport.coingecko_binding_status || identity.COINGECKO?.binding_status || "UNVERIFIED" : "UNVERIFIED",
    coinpaprikaBinding: verified ? passport.coinpaprika_binding_status || identity.COINPAPRIKA?.binding_status || "UNVERIFIED" : "UNVERIFIED",
    submittedChain: asset.canonical_chain || asset.chain || "—",
    submittedAddress: asset.token_address || "—",
  };
}

export function filterRegistry(rows, query = "", filter = "ALL") {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = passportDisplayState(row.passport || {});
    const haystack = [row.name, row.symbol, row.chain, row.asset_id].join(" ").toLowerCase();
    const matchesQuery = !needle || haystack.includes(needle);
    const matchesFilter = filter === "ALL" || (filter === "EVALUATION_FAILURE" ? state.kind === "failure" : state.label === filter);
    return matchesQuery && matchesFilter;
  });
}

export function parseBeaconPath(pathname) {
  const path = decodeURIComponent(pathname || "/").replace(/\/+$/, "") || "/";
  if (path === "/") return { name: "landing" };
  if (path === "/assets") return { name: "registry" };
  if (path === "/submit") return { name: "submit" };
  if (path === "/proof") return { name: "proof" };
  const match = path.match(/^\/assets\/([^/]+)(\/challenge)?$/);
  if (match) return { name: match[2] ? "challenge" : "detail", assetId: match[1] };
  return { name: "not-found" };
}
