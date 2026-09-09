import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createAccount, createClient, decodeTransaction } from "../app/node_modules/genlayer-js/dist/index.js";
import { testnetBradbury } from "../app/node_modules/genlayer-js/dist/chains/index.js";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEventLogs,
  keccak256,
  toHex,
  toRlp,
} from "../app/node_modules/viem/_esm/index.js";

const RPC = "https://rpc-bradbury.genlayer.com";
const CHAIN_RPC = "https://rpc.testnet-chain.genlayer.com";
const RPCS = [RPC, CHAIN_RPC];
const MAIN = testnetBradbury.consensusMainContract.address;
const CHAIN = { id: 4221, name: "GenLayer Bradbury", nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } } };
const require = createRequire(import.meta.url);
const keytar = require("C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/package.json");
const keytarApi = require("C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/keytar");
const signerName = process.env.BEACON_SIGNER_NAME || "deployer";
const key = await keytarApi.getPassword("genlayer-cli", `account:${signerName}`);
if (!key) throw new Error(`Configured ${signerName} credential is unavailable`);
const account = createAccount(key);
const transport = http(RPC, { timeout: 15000, retryCount: 0 });
const publicClient = createPublicClient({ chain: CHAIN, transport });
const directTransport = http(CHAIN_RPC, { timeout: 15000, retryCount: 0 });
const directPublicClient = createPublicClient({ chain: CHAIN, transport: directTransport });
const walletClient = createWalletClient({ account, chain: CHAIN, transport });
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
const readRpcAt = async (url, method, params) => {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }) });
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
};
const readRpc = (method, params) => readRpcAt(RPC, method, params);
const sendRawAt = async (url, raw) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "eth_sendRawTransaction", params: [raw] }), signal: controller.signal });
    const body = await response.json();
    if (body.error) throw new Error(JSON.stringify(body.error));
    return body.result;
  } finally { clearTimeout(timer); }
};
const sendRaw = async (raw) => {
  const results = await Promise.all(RPCS.map(async (url) => {
    try { return { url, result: await sendRawAt(url, raw) }; }
    catch (error) { return { url, error: String(error) }; }
  }));
  const accepted = results.find((item) => item.result);
  if (!accepted) throw new Error(`eth_sendRawTransaction failed on both official RPCs: ${safe(results)}`);
  console.log(safe({ event: "dual_rpc_propagation", results: results.map((item) => ({ url: item.url, result: item.result, error: item.error })) }));
  return accepted.result;
};
const rawReceipt = (txId) => readRpc("gen_getTransactionReceipt", [{ txId }]);
const latestState = async () => {
  const [chainGasPrice, directGasPrice, latestNonce, pendingNonce, directLatestNonce, directPendingNonce, block] = await Promise.all([
    readRpc("eth_gasPrice", []),
    readRpcAt(CHAIN_RPC, "eth_gasPrice", []),
    publicClient.getTransactionCount({ address: account.address, blockTag: "latest" }),
    publicClient.getTransactionCount({ address: account.address, blockTag: "pending" }),
    directPublicClient.getTransactionCount({ address: account.address, blockTag: "latest" }),
    directPublicClient.getTransactionCount({ address: account.address, blockTag: "pending" }),
    publicClient.getBlock({ blockTag: "latest" }),
  ]);
  return { chainId: await publicClient.getChainId(), balance: await publicClient.getBalance({ address: account.address }), latestNonce, pendingNonce, directLatestNonce, directPendingNonce, gasPrice: [BigInt(chainGasPrice), BigInt(directGasPrice)].reduce((a, b) => a > b ? a : b), genlayerGasPrice: BigInt(chainGasPrice), directGasPrice: BigInt(directGasPrice), block };
};
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
const waitOuter = async (hash) => {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    for (const url of RPCS) {
      const receipt = await readRpcAt(url, "eth_getTransactionReceipt", [hash]).catch(() => null);
      if (receipt) return { ...receipt, status: receipt.status === "0x1" ? "success" : "reverted", blockNumber: BigInt(receipt.blockNumber), gasUsed: BigInt(receipt.gasUsed), transactionHash: receipt.transactionHash || hash };
    }
    await sleep(2000);
  }
  throw new Error(`outer receipt not observed on either official RPC for ${hash}`);
};
const estimateOuterGas = async (request) => {
  try { return await publicClient.estimateGas(request); }
  catch (firstError) {
    try { return await directPublicClient.estimateGas(request); }
    catch (secondError) { throw new Error(`eth_estimateGas failed on both official RPCs: ${safe({ genlayer: String(firstError), direct: String(secondError) })}`); }
  }
};
const estimateAndSend = async ({ recipient, data, value = 0n, label, broadcast = true }) => {
  const state = await latestState();
  if (state.latestNonce !== state.pendingNonce || state.directLatestNonce !== state.directPendingNonce || state.latestNonce !== state.directLatestNonce) throw new Error(`${label}: nonce disagreement ${safe({ latest: state.latestNonce, pending: state.pendingNonce, directLatest: state.directLatestNonce, directPending: state.directPendingNonce })}`);
  const calldata = addData(recipient, data);
  const estimate = await estimateOuterGas({ account, to: MAIN, data: calldata, value });
  const blockGasLimit = state.block.gasLimit;
  const gas = (estimate * 3n + 1n) / 2n;
  if (gas >= (blockGasLimit * 9n) / 10n) throw new Error(`${label}: manual gas ${gas} too close to block limit ${blockGasLimit}`);
  const result = { label, from: account.address, to: MAIN, recipient, value: value.toString(), estimate: estimate.toString(), manualGas: gas.toString(), blockGasLimit: blockGasLimit.toString(), calldataBytes: (calldata.length - 2) / 2, gasPrice: state.gasPrice.toString() };
  if (!broadcast) return result;
  console.log(safe({ event: "pre_broadcast", ...result }));
  const raw = await account.signTransaction({ account, to: MAIN, data: calldata, value, gas, gasPrice: state.gasPrice, nonce: state.pendingNonce, type: "legacy", chainId: 4221 });
  const localHash = keccak256(raw);
  await persistSigned(label, raw, { label, evmHash: localHash, nonce: state.pendingNonce.toString(), gas: gas.toString(), gasPrice: state.gasPrice.toString(), to: MAIN, recipient, value: value.toString(), calldata });
  console.log(safe({ event: "signed", label, evmHash: localHash, nonce: state.pendingNonce, gas: gas.toString(), gasPrice: state.gasPrice.toString() }));
  let hash;
  try { hash = await sendRaw(raw); }
  catch (error) {
    const recovered = await publicClient.getTransaction({ hash: localHash }).catch(() => null);
    if (!recovered) throw new Error(`${label}: eth_sendRawTransaction failed before a recoverable hash: ${String(error)}`);
    hash = localHash;
  }
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
  await publicClient.call({ account, to: MAIN, data, value: 0n }).catch(async () => directPublicClient.call({ account, to: MAIN, data, value: 0n }));
  const estimate = await estimateOuterGas({ account, to: MAIN, data, value: 0n });
  const state = await latestState();
  if (state.latestNonce !== state.pendingNonce || state.directLatestNonce !== state.directPendingNonce || state.latestNonce !== state.directLatestNonce) throw new Error(`${label}: finalizer nonce disagreement`);
  const gas = (estimate * 3n + 1n) / 2n;
  const raw = await account.signTransaction({ account, to: MAIN, data, value: 0n, gas, gasPrice: state.gasPrice, nonce: state.pendingNonce, type: "legacy", chainId: 4221 });
  const hash = keccak256(raw);
  await persistSigned(`${label}-finalize`, raw, { label: `${label}-finalize`, evmHash: hash, nonce: state.pendingNonce.toString(), gas: gas.toString(), gasPrice: state.gasPrice.toString(), to: MAIN, data });
  await sendRaw(raw);
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
const evidenceDir = "docs/reviewer-remediation-2026-09/final-submission/chain-writes";
const persistSigned = async (label, raw, metadata) => {
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(`${evidenceDir}/${label}-${metadata.nonce}.json`, safe({ ...metadata, rawSignedTransaction: raw }), "utf8");
};
const command = process.argv[2] || "measure";
if (command === "sizes") {
  const serialized = deployData(source);
  const calldata = addData("0x0000000000000000000000000000000000000000", serialized);
  console.log(safe({ sourceBytes: new TextEncoder().encode(source).length, serializedDeployBytes: (serialized.length - 2) / 2, calldataBytes: (calldata.length - 2) / 2, account: account.address, main: MAIN }));
} else if (command === "hash") {
  const nonce = BigInt(process.argv[3]);
  const gasPrice = BigInt(process.argv[4]);
  const gas = BigInt(process.argv[5]);
  const data = addData("0x0000000000000000000000000000000000000000", deployData(source));
  const raw = await account.signTransaction({ account, to: MAIN, data, value: 0n, gas, gasPrice, nonce, type: "legacy", chainId: 4221 });
  console.log(safe({ nonce, gasPrice, gas, hash: keccak256(raw), calldataBytes: (data.length - 2) / 2 }));
} else if (command === "resend-exact") {
  const nonce = BigInt(process.argv[3]);
  const gasPrice = BigInt(process.argv[4]);
  const gas = BigInt(process.argv[5]);
  const data = addData("0x0000000000000000000000000000000000000000", deployData(source));
  const raw = await account.signTransaction({ account, to: MAIN, data, value: 0n, gas, gasPrice, nonce, type: "legacy", chainId: 4221 });
  const evmHash = keccak256(raw);
  await persistSigned("deploy-replacement", raw, { label: "deploy-replacement", evmHash, nonce: nonce.toString(), gas: gas.toString(), gasPrice: gasPrice.toString(), to: MAIN, recipient: "0x0000000000000000000000000000000000000000", value: "0", calldata: data });
  console.log(safe({ event: "same_raw_submission", evmHash, nonce, gas, gasPrice }));
  try { console.log(safe({ event: "same_raw_result", evmHash: await sendRaw(raw) })); }
  catch (error) { const known = await publicClient.getTransaction({ hash: evmHash }).catch(() => null); console.log(safe({ event: "same_raw_error", evmHash, known: Boolean(known), error: String(error) })); if (known) process.exitCode = 0; else process.exitCode = 1; }
} else if (command === "cancel-pending") {
  const nonce = BigInt(process.argv[3]);
  const gasPrice = BigInt(process.argv[4]);
  const gas = await estimateOuterGas({ account, to: account.address, value: 0n });
  const raw = await account.signTransaction({ account, to: account.address, data: "0x", value: 0n, gas, gasPrice, nonce, type: "legacy", chainId: 4221 });
  const evmHash = keccak256(raw);
  console.log(safe({ event: "cancel_signed", evmHash, nonce, gas, gasPrice }));
  const sent = await sendRaw(raw);
  const receipt = await waitOuter(sent);
  console.log(safe({ event: "cancel_confirmed", evmHash: sent, status: receipt.status, block: receipt.blockNumber, gasUsed: receipt.gasUsed }));
} else if (command === "measure") {
  const serialized = deployData(source);
  const calldata = addData("0x0000000000000000000000000000000000000000", serialized);
  const estimate = await estimateOuterGas({ account, to: MAIN, data: calldata, value: 0n });
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
} else if (command === "estimate-write") {
  const [method, argsJson, valueWei = "0", recipient] = process.argv.slice(3);
  if (!method || !argsJson || !recipient) throw new Error("estimate-write requires method, JSON args, value, and recipient");
  const parsedArgs = argsJson.startsWith("@") ? JSON.parse(await readFile(argsJson.slice(1), "utf8")) : JSON.parse(argsJson);
  const result = await estimateAndSend({ recipient, data: appData(method, parsedArgs), value: BigInt(valueWei), label: `estimate-${method}`, broadcast: false });
  console.log(safe(result));
} else if (command === "estimate-sequence") {
  const recipient = process.argv[3];
  if (!recipient) throw new Error("estimate-sequence requires recipient");
  const id = "eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  const entries = [
    ["submit_asset", ["", "USDC", "ethereum", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "USD", "usd-coin", "usdc-usd-coin", "https://developers.circle.com/stablecoins/usdc-contract-addresses.md", "https://developers.circle.com/circle-mint/concepts/how-minting-works.md", "https://developers.circle.com/stablecoins/what-is-usdc.md", "https://developers.circle.com/cctp/references/technical-guide.md", "https://developers.circle.com/xreserve/concepts/usdc-backed-stablecoin-specification.md"], 1000000000000000000n],
    ["verify_coingecko_identity", [id], 0n],
    ["verify_coinpaprika_identity", [id], 0n],
    ["verify_semantic_source", [id, "ISSUER"], 0n],
    ["verify_semantic_source", [id, "REDEMPTION"], 0n],
    ["verify_semantic_source", [id, "BACKING"], 0n],
    ["verify_semantic_source", [id, "SECURITY"], 0n],
    ["verify_semantic_source", [id, "GOVERNANCE"], 0n],
    ["refresh_coingecko_market", [id], 0n],
    ["refresh_coinpaprika_market", [id], 0n],
    ["evaluate_asset", [id], 0n],
    ["challenge_asset", [id, 1, "OTHER", "CoinPaprika official USDC metadata identifies the canonical Ethereum USDC contract and asset identity.", "https://api.coinpaprika.com/v1/coins/usdc-usd-coin"], 250000000000000000n],
    ["challenge_asset", [id, 1, "LIQUIDITY", "DexScreener Ethereum pair metadata exposes liquidity and volume for a pair whose base token is canonical Ethereum USDC.", "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x0fb0e40cec3bb23e13abc585958a93c796fbea56955e19a23727a716a0423239"], 250000000000000000n],
    ["reassess_asset", [id], 0n],
  ];
  const results = [];
  for (const [method, args, value] of entries) results.push(await estimateAndSend({ recipient, data: appData(method, args), value, label: `estimate-${method}`, broadcast: false }));
  console.log(safe({ entries: results, totalManualGas: results.reduce((sum, item) => sum + BigInt(item.manualGas), 0n) }));
} else {
  throw new Error(`Unknown command ${command}`);
}
