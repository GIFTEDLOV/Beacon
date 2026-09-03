import { readFileSync } from "fs";
import path from "path";
import type { GenLayerClient } from "genlayer-js/types";


export default async function main(client: GenLayerClient<any>) {
  const filePath = path.resolve(process.cwd(), "contracts/beacon_v5.py");

  try {
    const contractCode = new Uint8Array(readFileSync(filePath));

    await client.initializeConsensusSmartContract();

    const deployTransaction = await client.deployContract({
      code: contractCode,
      args: [],
    });

    console.log("DEPLOYMENT_TX_HASH", deployTransaction);

    const receipt = await client.waitForTransactionReceipt({
      hash: deployTransaction,
      status: "FINALIZED",
      interval: 5000,
      retries: 200,
    });

    if (receipt.consensus_data?.leader_receipt[0]?.execution_result !== "SUCCESS") {
      throw new Error(`Deployment failed. Receipt: ${JSON.stringify(receipt)}`);
    }

    console.log("\n Contract deployed successfully.", {
      "Transaction Hash": deployTransaction,
      "Contract Address":
        receipt.data?.contract_address ??
        (receipt.txDataDecoded as any)?.contractAddress,
    });
  } catch (error) {
    throw new Error((`Error during deployment:, ${error}`));
  }
}
