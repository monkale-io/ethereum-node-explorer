import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardLive } from "../hooks/useDashboardLive";
import { useEthereum } from "../hooks/useEthereum";
import { useConfigStore } from "../stores/configStore";

vi.mock("../hooks/useEthereum", () => ({
  useEthereum: vi.fn(),
}));

vi.mock("../stores/configStore", () => ({
  useConfigStore: vi.fn(),
}));

describe("useDashboardLive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty state when no ethereum service or rpcUrl is available", () => {
    (useEthereum as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue("");

    const { result } = renderHook(() => useDashboardLive());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.blocks).toEqual([]);
    expect(result.current.latestBlockNumber).toBeNull();
    expect(result.current.status).toBeNull();
  });

  it("fetches data successfully", async () => {
    const mockEth = {
      getLatestBlockNumber: vi.fn().mockResolvedValue(100n),
      getChainId: vi.fn().mockResolvedValue(1),
      getSyncStatus: vi.fn().mockResolvedValue(false),
      getClientVersion: vi.fn().mockResolvedValue("Geth/v1.0.0"),
      getPeerCount: vi.fn().mockResolvedValue(10),
      getBlock: vi.fn().mockImplementation((n) => Promise.resolve({ number: n, hash: `0x${n}` })),
    };

    (useEthereum as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockEth);
    (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue("http://localhost:8545");

    const { result } = renderHook(() => useDashboardLive());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.latestBlockNumber).toBe(100n);
    expect(result.current.blocks.length).toBe(10);
    expect(result.current.status?.isConnected).toBe(true);
    expect(result.current.status?.chainId).toBe(1);
  });

  it("handles errors smoothly", async () => {
    const mockEth = {
      getLatestBlockNumber: vi.fn().mockRejectedValue(new Error("RPC Error")),
      getChainId: vi.fn().mockRejectedValue(new Error("RPC Error")),
      getSyncStatus: vi.fn().mockResolvedValue(false),
      getClientVersion: vi.fn().mockResolvedValue("Geth/v1.0.0"),
      getPeerCount: vi.fn().mockResolvedValue(10),
      getBlock: vi.fn().mockResolvedValue({}),
    };

    (useEthereum as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockEth);
    (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue("http://localhost:8545");

    const { result } = renderHook(() => useDashboardLive());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe("RPC Error");
  });
});
