import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BlockPage } from "../components/block/BlockPage";
import * as useEthereumModule from "../hooks/useEthereum";

vi.mock("../hooks/useEthereum", () => ({
  useEthereum: vi.fn(),
}));

describe("BlockPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement, initialRoute = "/block/100") => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/block/:blockId" element={ui} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders loading state initially", () => {
    const getBlockMock = vi.fn(() => new Promise(() => {}));
    const getLatestBlockMock = vi.fn(() => new Promise(() => {}));
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getBlock: getBlockMock,
      getLatestBlockNumber: getLatestBlockMock,
    } as any);

    renderWithRouter(<BlockPage />);
    expect(document.querySelector('.animate-spin')).not.toBeNull();
  });

  it("renders block not found", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getBlock: vi.fn().mockRejectedValue(new Error("Not found")),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
    } as any);

    renderWithRouter(<BlockPage />);
    await waitFor(() => {
      expect(screen.getByText(/Block not found/i)).toBeInTheDocument();
    });
  });

  it("renders block details after loading", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getBlock: vi.fn().mockResolvedValue({
        number: 100n,
        hash: "0x123",
        timestamp: 1700000000n,
        gasUsed: 21000n,
        gasLimit: 30000000n,
        baseFeePerGas: 1000000000n,
        miner: "0xabc",
        transactions: ["0xdef", "0xghi"],
        size: 1024n,
        parentHash: "0x012",
      }),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
    } as any);

    renderWithRouter(<BlockPage />);
    await waitFor(() => {
      expect(screen.getByText(/0x123/)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/100/).length).toBeGreaterThan(0);
    expect(screen.getByText(/21,000/)).toBeInTheDocument();
    expect(screen.getByText(/30,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/0xabc/)).toBeInTheDocument();
  });
});
