import {
  createAccount as createGenLayerAccount,
  createClient,
  generatePrivateKey,
} from "genlayer-js";
import { simulator } from "genlayer-js/chains";

const ACCOUNT_KEY = "beacon.account.privateKey";

function storage() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function getAccount() {
  const privateKey = storage()?.getItem(ACCOUNT_KEY);
  return privateKey ? createGenLayerAccount(privateKey) : null;
}

export function createAccount() {
  const privateKey = generatePrivateKey();
  storage()?.setItem(ACCOUNT_KEY, privateKey);
  return createGenLayerAccount(privateKey);
}

export function removeAccount() {
  storage()?.removeItem(ACCOUNT_KEY);
}

export function createGenLayerClient(account = getAccount()) {
  return createClient({
    chain: simulator,
    ...(account ? { account } : {}),
    ...(import.meta.env?.VITE_GENLAYER_RPC
      ? { endpoint: import.meta.env.VITE_GENLAYER_RPC }
      : {}),
  });
}

export const account = getAccount();
