import { describe, it, expect, vi, beforeEach } from "vitest";
import { EthereumService } from "@/services/EthereumService";

vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getChainId: vi.fn().mockResolvedValue(1),
      getBlockNumber: vi.fn().mockResolvedValue(19000000n),
      getBlock: vi.fn().mockResolvedValue({
        number: 19000000n,
        hash: "0xabc",
        timestamp: 1700000000n,
        transactions: [],
      }),
      getTransaction: vi.fn().mockResolvedValue({
        hash: "0xdef",
        from: "0x123",
        to: "0x456",
        value: 1000000000000000000n,
      }),
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success",
        gasUsed: 21000n,
      }),
      getBalance: vi.fn().mockResolvedValue(5000000000000000000n),
      getCode: vi.fn().mockResolvedValue("0x"),
      request: vi.fn().mockImplementation(({ method }: { method: string }) => {
        if (method === "eth_syncing") return Promise.resolve(false);
        if (method === "net_peerCount") return Promise.resolve("0x19");
        if (method === "web3_clientVersion")
          return Promise.resolve("Geth/v1.13.0");
        return Promise.resolve(null);
      }),
    })),
  };
});

describe("EthereumService", () => {
  let service: EthereumService;

  beforeEach(() => {
    service = new EthereumService("http://localhost:8545");
  });

  it("testConnection returns success with chainId", async () => {
    const result = await service.testConnection();
    expect(result.success).toBe(true);
    expect(result.chainId).toBe(1);
  });

  it("getLatestBlockNumber returns a bigint", async () => {
    const blockNum = await service.getLatestBlockNumber();
    expect(blockNum).toBe(19000000n);
  });

  it("getBlock returns block data", async () => {
    const block = await service.getBlock(19000000n);
    expect(block.number).toBe(19000000n);
  });

  it("getBalance returns balance in wei", async () => {
    const balance = await service.getBalance("0x123" as `0x${string}`);
    expect(balance).toBe(5000000000000000000n);
  });

  it("getSyncStatus returns false when synced", async () => {
    const status = await service.getSyncStatus();
    expect(status).toBe(false);
  });

  it("getPeerCount returns a number", async () => {
    const peers = await service.getPeerCount();
    expect(peers).toBe(25);
  });

  it("getClientVersion returns a string", async () => {
    const version = await service.getClientVersion();
    expect(version).toBe("Geth/v1.13.0");
  });

  it("getTransaction returns a transaction", async () => {
    const tx = await service.getTransaction("0xdef");
    expect(tx.hash).toBe("0xdef");
  });

  it("getTransactionReceipt returns a receipt", async () => {
    const receipt = await service.getTransactionReceipt("0xdef");
    expect(receipt.status).toBe("success");
  });

  it("getCode returns hex code", async () => {
    const code = await service.getCode("0x123" as `0x${string}`);
    expect(code).toBe("0x");
  });

  it("reconfigure does not throw", () => {
    expect(() => service.reconfigure("http://other:8545")).not.toThrow();
  });
});
