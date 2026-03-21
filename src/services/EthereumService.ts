import {
  createPublicClient,
  http,
  type PublicClient,
  type Hash,
  type Address,
  type Hex,
  type Block,
  type Transaction,
  type TransactionReceipt,
} from "viem";
import { mainnet } from "viem/chains";
import type { SyncStatus } from "@/types/ethereum";

export class EthereumService {
  private client: PublicClient;

  constructor(rpcUrl: string) {
    this.client = this.buildClient(rpcUrl);
  }

  reconfigure(rpcUrl: string): void {
    this.client = this.buildClient(rpcUrl);
  }

  async getLatestBlockNumber(): Promise<bigint> {
    return this.client.getBlockNumber();
  }

  async getBlock(
    identifier: bigint | Hash,
    includeTransactions = false,
  ): Promise<Block> {
    const params = typeof identifier === "bigint"
      ? { blockNumber: identifier, includeTransactions }
      : { blockHash: identifier, includeTransactions };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.client.getBlock(params as any) as Promise<Block>;
  }

  async getTransaction(hash: Hash): Promise<Transaction> {
    return this.client.getTransaction({ hash }) as Promise<Transaction>;
  }

  async getTransactionReceipt(hash: Hash): Promise<TransactionReceipt> {
    return this.client.getTransactionReceipt({ hash });
  }

  async getBalance(address: Address): Promise<bigint> {
    return this.client.getBalance({ address });
  }

  async getCode(address: Address): Promise<Hex> {
    const code = await this.client.getCode({ address });
    return code ?? "0x";
  }

  async getChainId(): Promise<number> {
    return this.client.getChainId();
  }

  async getSyncStatus(): Promise<SyncStatus | false> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await this.client.request({ method: "eth_syncing" as any });
    if (result === false) return false;
    return {
      startingBlock: BigInt(result.startingBlock ?? "0x0"),
      currentBlock: BigInt(result.currentBlock ?? "0x0"),
      highestBlock: BigInt(result.highestBlock ?? "0x0"),
    };
  }

  async getPeerCount(): Promise<number | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await this.client.request({ method: "net_peerCount" as any });
      return Number(BigInt(result));
    } catch {
      return null; // Method not supported (e.g., Hardhat)
    }
  }

  async getClientVersion(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await this.client.request({ method: "web3_clientVersion" as any });
    return String(result);
  }

  async testConnection(): Promise<{ success: boolean; chainId?: number; error?: string }> {
    try {
      const chainId = await this.client.getChainId();
      return { success: true, chainId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  private buildClient(rpcUrl: string): PublicClient {
    return createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl, { timeout: 10_000 }),
    });
  }
}
