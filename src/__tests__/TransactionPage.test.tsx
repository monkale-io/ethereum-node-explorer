import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TransactionPage } from "../components/transaction/TransactionPage";
import * as useEthereumModule from "../hooks/useEthereum";

vi.mock("../hooks/useEthereum", () => ({
  useEthereum: vi.fn(),
}));

describe("TransactionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement, initialRoute = "/tx/0x123") => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/tx/:txHash" element={ui} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders error state when not found", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getTransaction: vi.fn().mockRejectedValue(new Error("Not found")),
      getTransactionReceipt: vi.fn().mockRejectedValue(new Error("Not found")),
      getLatestBlockNumber: vi.fn().mockRejectedValue(new Error("Not found")),
    } as any);

    renderWithRouter(<TransactionPage />);
    await waitFor(() => {
      expect(screen.getByText(/Transaction Not Found/i)).toBeInTheDocument();
    });
  });

  it("renders transaction details and receipt after loading", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getTransaction: vi.fn().mockResolvedValue({
        hash: "0x123",
        blockNumber: 100n,
        from: "0xabc",
        to: "0xdef",
        value: 1000000000000000000n,
        gas: 21000n,
        gasPrice: 1000000000n,
        nonce: 5,
        input: "0x",
      }),
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success",
        gasUsed: 21000n,
        effectiveGasPrice: 1000000000n,
        contractAddress: null,
      }),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
    } as any);

    renderWithRouter(<TransactionPage />);
    await waitFor(() => {
      expect(screen.getByText(/Transaction Details/i)).toBeInTheDocument();
    });
    
    // Using simple checks for presence of elements to ensure rendering doesn't crash
    expect(screen.getByText(/0x123/)).toBeInTheDocument();
    expect(screen.getByText(/0xabc/)).toBeInTheDocument();
    expect(screen.getByText(/0xdef/)).toBeInTheDocument();
    
    // Check status
    expect(screen.getAllByText(/Success/).length).toBeGreaterThan(0);
    
    // Check ETH Value formatting
    expect(screen.getByText(/1 ETH/)).toBeInTheDocument();
  });
});
