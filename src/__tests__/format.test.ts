import { describe, it, expect } from "vitest";
import {
  truncateHash,
  formatWei,
  formatEth,
  formatGas,
  formatTimestamp,
  timeAgo,
  detectSearchInput,
  chainName,
} from "../lib/format";

describe("format utilities", () => {
  describe("truncateHash", () => {
    it("truncates long hashes", () => {
      expect(truncateHash("0x1234567890abcdef1234567890abcdef12345678", 6, 4)).toBe("0x123456...5678");
    });
    it("returns original if too short", () => {
      expect(truncateHash("0x123456", 6, 4)).toBe("0x123456");
      expect(truncateHash("0x123456", 2, 2)).toBe("0x12...56");
    });
  });

  describe("formatWei and formatEth", () => {
    it("formatWei formats wei to ether", () => {
      expect(formatWei(1000000000000000000n)).toBe("1");
      expect(formatWei(500000000000000000n)).toBe("0.5");
    });
    it("formatEth formats ether with decimals", () => {
      expect(formatEth(1234567890000000000n, 4)).toBe("1.2346 ETH");
      expect(formatEth(1000000000000000000n, 2)).toBe("1 ETH");
    });
  });

  describe("formatGas", () => {
    it("formats gas with commas", () => {
      expect(formatGas(21000n)).toBe(Number(21000).toLocaleString());
      expect(formatGas(15000000n)).toBe(Number(15000000).toLocaleString());
    });
  });

  describe("formatTimestamp", () => {
    it("formats unix timestamp to locale string", () => {
      const ts = 1700000000n;
      const expected = new Date(Number(ts) * 1000).toLocaleString();
      expect(formatTimestamp(ts)).toBe(expected);
    });
  });

  describe("timeAgo", () => {
    it("formats relative time", () => {
      const now = Math.floor(Date.now() / 1000);
      expect(timeAgo(BigInt(now - 2))).toBe("just now");
      expect(timeAgo(BigInt(now - 30))).toBe("30s ago");
      expect(timeAgo(BigInt(now - 120))).toBe("2m ago");
      expect(timeAgo(BigInt(now - 7200))).toBe("2h ago");
      expect(timeAgo(BigInt(now - 100000))).toBe("1d ago");
    });
  });

  describe("detectSearchInput", () => {
    it("detects blocks", () => {
      expect(detectSearchInput("12345")).toBe("block");
    });
    it("detects transactions", () => {
      expect(detectSearchInput("0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3")).toBe("transaction");
    });
    it("detects addresses", () => {
      expect(detectSearchInput("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")).toBe("address");
    });
    it("detects unknown", () => {
      expect(detectSearchInput("invalid")).toBe("unknown");
    });
  });

  describe("chainName", () => {
    it("returns known chains", () => {
      expect(chainName(1)).toBe("Mainnet");
      expect(chainName(11155111)).toBe("Sepolia");
    });
    it("returns fallback for unknown chains", () => {
      expect(chainName(999)).toBe("Chain 999");
    });
  });
});
