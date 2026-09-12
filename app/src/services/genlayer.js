import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const STUDIONET_CHAIN = studionet;
export const STUDIONET_RPC = "https://studio.genlayer.com/api";

function endpoint() {
  return STUDIONET_RPC;
}

function ethereumProvider() {
  return typeof window === "undefined" ? null : window.ethereum || null;
}

// Account-free reads are the source of truth for every rendered state.
export function createReadClient() {
  return createClient({ chain: STUDIONET_CHAIN, endpoint: endpoint() });
}

// Writes are explicitly wallet/provider-backed. No private key is generated or
// stored by the Beacon frontend.
export async function createWriteClient() {
  const provider = ethereumProvider();
  if (!provider?.request) throw new Error("Connect a wallet to submit a Beacon transaction.");
  let accounts = await provider.request({ method: "eth_accounts" });
  if (!Array.isArray(accounts) || !accounts[0]) accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || !accounts[0]) throw new Error("The connected wallet returned no account.");
  return createClient({ chain: STUDIONET_CHAIN, endpoint: endpoint(), account: accounts[0], provider });
}

// Kept as a small compatibility alias for tooling that only needs a read client.
export function createGenLayerClient() {
  return createReadClient();
}
