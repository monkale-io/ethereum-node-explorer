import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEthereum, EthereumProvider } from "../hooks/useEthereum";
import { useConfigStore } from "../stores/configStore";

vi.mock("../stores/configStore", () => ({
  useConfigStore: vi.fn(),
}));

describe("useEthereum", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no context is provided", () => {
    const { result } = renderHook(() => useEthereum());
    expect(result.current).toBeNull();
  });

  it("provides an EthereumService instance when rpcUrl is set", () => {
    (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue("http://localhost:8545");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EthereumProvider>{children}</EthereumProvider>
    );

    const { result, rerender } = renderHook(() => useEthereum(), { wrapper });
    
    expect(result.current).not.toBeNull();
    // Re-render to test useEffect handling same URL
    rerender();
    expect(result.current).not.toBeNull();
  });

  it("handles rpcUrl changing", () => {
    let mockUrl = "http://localhost:8545";
    (useConfigStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockUrl);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EthereumProvider>{children}</EthereumProvider>
    );

    const { result, rerender } = renderHook(() => useEthereum(), { wrapper });
    
    expect(result.current).not.toBeNull();
    const firstInstance = result.current;

    // Change URL
    mockUrl = "http://other:8545";
    rerender();

    // Since we mutate in place via reconfigure, it is the same instance, but reconfigured.
    expect(result.current).toBe(firstInstance);
  });
});
