import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createAccount, createClient, decodeTransaction } from "../app/node_modules/genlayer-js/dist/index.js";
import { testnetBradbury } from "../app/node_modules/genlayer-js/dist/chains/index.js";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEventLogs,
  toHex,
  toRlp,
} from "../app/node_modules/viem/_esm/index.js";

const RPC = "https://rpc-bradbury.genlayer.com";
const MAIN = testnetBradbury.consensusMainContract.address;
const CHAIN = { id: 4221, name: "GenLayer Bradbury", nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } } };
const require = createRequire(import.meta.url);
const keytar = require("C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/package.json");
const keytarApi = require("C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/keytar");
const key = await keytarApi.getPassword("genlayer-cli", "account:deployer");
if (!key) throw new Error("Configured deployer credential is unavailable");
const account = createAccount(key);
const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC) });
const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC) });
const genClient = createClient({ chain: testnetBradbury, account, endpoint: RPC });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const safe = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);

const TYPE_PINT = 1;
const TYPE_NINT = 2;
const TYPE_BYTES = 3;
const TYPE_STR = 4;
const TYPE_ARR = 5;
const TYPE_MAP = 6;
const appendUleb = (out, value) => {
  if (value === 0) { out.push(0); return; }
  while (value > 0) {
    let part = value & 0x7f;
    value = Math.floor(value / 128);
    if (value > 0) part |= 0x80;
    out.push(part);
  }
};
function encodeCd(value) {
  const out = [];
  const put = (item) => {
    if (item === null || item === undefined) { out.push(0); return; }
    if (item === false) { out.push(8); return; }
    if (item === true) { out.push(16); return; }
    if (typeof item === "bigint" || typeof item === "number") {
      const integer = BigInt(item);
      if (integer >= 0n) appendUleb(out, Number((integer << 3n) | BigInt(TYPE_PINT)));
      else appendUleb(out, Number(((-integer - 1n) << 3n) | BigInt(TYPE_NINT)));
      return;
    }
    if (typeof item === "string") {
      const bytes = new TextEncoder().encode(item);
      appendUleb(out, (bytes.length << 3) | TYPE_STR);
      out.push(...bytes);
      return;
    }
    if (item instanceof Uint8Array) {
      appendUleb(out, (item.length << 3) | TYPE_BYTES);
      out.push(...item);
      return;
    }
    if (Array.isArray(item)) {
      appendUleb(out, (item.length << 3) | TYPE_ARR);
      item.forEach(put);
      return;
    }
    if (typeof item === "object") {
      const entries = Object.entries(item).sort(([a], [b]) => a.localeCompare(b));
      appendUleb(out, (entries.length << 3) | TYPE_MAP);
      for (const [name, entry] of entries) {
        const bytes = new TextEncoder().encode(name);
        appendUleb(out, bytes.length);
        out.push(...bytes);
        put(entry);
      }
      return;
    }
    throw new Error(`Unsupported calldata value: ${typeof item}`);
  };
  put(value);
  return Uint8Array.from(out);
}
const callObject = (method, args = []) => method ? { method, args } : (args.length ? { args } : {});
const serialize = (items) => toRlp(items.map((item) => toHex(item)));
const appData = (method, args) => serialize([encodeCd(callObject(method, args)), false]);
const deployData = (code) => serialize([code, encodeCd({}), false]);
const addAbi = [{ type: "function", name: "addTransaction", stateMutability: "nonpayable", inputs: [
  { name: "_sender", type: "address" }, { name: "_recipient", type: "address" },
  { name: "_numOfInitialValidators", type: "uint256" }, { name: "_maxRotations", type: "uint256" },
  { name: "_txData", type: "bytes" }, { name: "_validUntil", type: "uint256" },
], outputs: [] }];
const finalizeAbi = [{ type: "function", name: "finalizeTransaction", stateMutability: "nonpayable", inputs: [{ name: "_txId", type: "bytes32" }], outputs: [] }];
const addData = (recipient, data) => encodeFunctionData({ abi: addAbi, functionName: "addTransaction", args: [account.address, recipient, testnetBradbury.defaultNumberOfInitialValidators, testnetBradbury.defaultConsensusMaxRotations, data, 0n] });
const readRpc = async (method, params) => {
  const response = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }) });
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
};
const rawReceipt = (txId) => readRpc("gen_getTransactionReceipt", [{ txId }]);
const latestState = async () => ({ chainId: await publicClient.getChainId(), balance: await publicClient.getBalance({ address: account.address }), latestNonce: await publicClient.getTransactionCount({ address: account.address, blockTag: "latest" }), pendingNonce: await publicClient.getTransactionCount({ address: account.address, blockTag: "pending" }), gasPrice: await publicClient.getGasPrice(), block: await publicClient.getBlock({ blockTag: "latest" }) });
const extractProtocolId = (receipt) => {
  const logs = receipt.logs || [];
  try {
    const events = parseEventLogs({ abi: testnetBradbury.consensusMainContract.abi, eventName: "NewTransaction", logs, strict: false });
    if (events.length) return events[0].args.txId;
  } catch {}
  for (const log of logs) {
    if (Array.isArray(log.topics) && log.topics.length >= 2 && log.topics[1]?.length === 66) return log.topics[1];
  }
  return null;
};
const waitOuter = async (hash) => publicClient.waitForTransactionReceipt({ hash, timeout: 300000, pollingInterval: 2000 });
const estimateAndSend = async ({ recipient, data, value = 0n, label, broadcast = true }) => {
  const state = await latestState();
  if (state.latestNonce !== state.pendingNonce) throw new Error(`${label}: nonce gap ${state.latestNonce}/${state.pendingNonce}`);
  const calldata = addData(recipient, data);
  const estimate = await publicClient.estimateGas({ account, to: MAIN, data: calldata, value });
  const blockGasLimit = state.block.gasLimit;
  const gas = (estimate * 3n + 1n) / 2n;
  if (gas >= (blockGasLimit * 9n) / 10n) throw new Error(`${label}: manual gas ${gas} too close to block limit ${blockGasLimit}`);
  const result = { label, from: account.address, to: MAIN, recipient, value: value.toString(), estimate: estimate.toString(), manualGas: gas.toString(), blockGasLimit: blockGasLimit.toString(), calldataBytes: (calldata.length - 2) / 2, gasPrice: state.gasPrice.toString() };
  if (!broadcast) return result;
  const hash = await walletClient.sendTransaction({ account, to: MAIN, data: calldata, value, gas, gasPrice: state.gasPrice, type: "legacy", chainId: 4221 });
  result.evmHash = hash;
  const receipt = await waitOuter(hash);
  result.outerStatus = receipt.status;
  result.outerBlock = receipt.blockNumber;
  result.outerGasUsed = receipt.gasUsed;
  result.protocolTxId = extractProtocolId(receipt);
  result.logCount = receipt.logs.length;
  if (receipt.status !== "success") throw new Error(`${label}: outer transaction reverted ${safe(result)}`);
  if (!result.protocolTxId) throw new Error(`${label}: no NewTransaction event ${safe(result)}`);
  return result;
};
async function finalizeIfReady(txId, label) {
  const data = encodeFunctionData({ abi: finalizeAbi, functionName: "finalizeTransaction", args: [txId] });
  await publicClient.call({ account, to: MAIN, data, value: 0n });
  const estimate = await publicClient.estimateGas({ account, to: MAIN, data, value: 0n });
  const state = await latestState();
  const gas = (estimate * 3n + 1n) / 2n;
  const hash = await walletClient.sendTransaction({ account, to: MAIN, data, value: 0n, gas, gasPrice: state.gasPrice, type: "legacy", chainId: 4221 });
  const receipt = await waitOuter(hash);
  if (receipt.status !== "success") throw new Error(`${label}: finalizer reverted ${hash}`);
  return { evmHash: hash, estimate: estimate.toString(), manualGas: gas.toString(), receiptStatus: receipt.status, gasUsed: receipt.gasUsed.toString() };
}
async function reconcile(txId, label) {
  const attempts = [];
  for (let attempt = 0; attempt < 360; attempt += 1) {
    const tx = await genClient.getTransaction({ hash: txId });
    const receipt = await rawReceipt(txId).catch((error) => ({ error: String(error) }));
    const status = Number(tx.status);
    attempts.push({ attempt, status: tx.status, statusName: tx.statusName, result: tx.resultName, execution: tx.txExecutionResultName, receiptStatus: receipt.status, receiptResult: receipt.result, receiptExecution: receipt.txExecutionResult });
    console.log(safe({ event: "protocol_poll", label, txId, attempt, status: tx.status, statusName: tx.statusName, result: tx.resultName, execution: tx.txExecutionResultName }));
    if (status === 7) return { txId, tx, receipt, attempts };
    if (status === 6) throw new Error(`${label}: protocol UNDETERMINED ${safe({ txId, attempts: attempts.at(-1) })}`);
    if ([2, 3, 4, 8, 9, 10, 11, 12, 13].includes(status)) throw new Error(`${label}: terminal protocol status ${safe({ txId, attempts: attempts.at(-1) })}`);
    if (status === 5) {
      let canAppeal = true;
      try { canAppeal = await genClient.canAppeal({ txId }); } catch {}
      if (canAppeal === false) {
        const finalized = await finalizeIfReady(txId, label);
        console.log(safe({ event: "same_tx_finalized", label, txId, ...finalized }));
      }
    }
    await sleep(5000);
  }
  throw new Error(`${label}: protocol polling exhausted for ${txId}`);
}
const source = await readFile("contracts/beacon_v7.py", "utf8");
const command = process.argv[2] || "measure";
if (command === "sizes") {
  const serialized = deployData(source);
  const calldata = addData("0x0000000000000000000000000000000000000000", serialized);
  console.log(safe({ sourceBytes: new TextEncoder().encode(source).length, serializedDeployBytes: (serialized.length - 2) / 2, calldataBytes: (calldata.length - 2) / 2, account: account.address, main: MAIN }));
} else if (command === "measure") {
  const serialized = deployData(source);
  const calldata = addData("0x0000000000000000000000000000000000000000", serialized);
  const estimate = await publicClient.estimateGas({ account, to: MAIN, data: calldata, value: 0n });
  const state = await latestState();
  console.log(safe({ sourceBytes: new TextEncoder().encode(source).length, serializedDeployBytes: (serialized.length - 2) / 2, calldataBytes: (calldata.length - 2) / 2, estimateGas: estimate, manualGas: (estimate * 3n + 1n) / 2n, blockGasLimit: state.block.gasLimit, balance: state.balance, latestNonce: state.latestNonce, pendingNonce: state.pendingNonce, chainId: state.chainId, account: account.address, main: MAIN }));
} else if (command === "deploy") {
  const result = await estimateAndSend({ recipient: "0x0000000000000000000000000000000000000000", data: deployData(source), label: "deploy" });
  console.log(safe({ event: "broadcast", ...result }));
  const reconciled = await reconcile(result.protocolTxId, "deploy");
  console.log(safe({ event: "finalized", ...result, ...reconciled }));
} else if (command === "write") {
  const [method, argsJson, valueWei = "0", recipient] = process.argv.slice(3);
  if (!method || !argsJson) throw new Error("write requires method and JSON args");
  const result = await estimateAndSend({ recipient, data: appData(method, JSON.parse(argsJson)), value: BigInt(valueWei), label: method });
  console.log(safe({ event: "broadcast", ...result }));
  const reconciled = await reconcile(result.protocolTxId, method);
  console.log(safe({ event: "finalized", ...result, ...reconciled }));
} else {
  throw new Error(`Unknown command ${command}`);
}
