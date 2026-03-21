import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AccountPage } from "../components/account/AccountPage";
import * as useEthereumModule from "../hooks/useEthereum";

vi.mock("../hooks/useEthereum", () => ({
  useEthereum: vi.fn(),
}));

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement, initialRoute = "/address/0x123") => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/address/:address" element={ui} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders error state when loading fails", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getBalance: vi.fn().mockRejectedValue(new Error("Load fail")),
      getCode: vi.fn().mockResolvedValue("0x"),
    } as any);

    renderWithRouter(<AccountPage />);
    await waitFor(() => {
      expect(screen.getByText(/Account Error/i)).toBeInTheDocument();
    });
  });

  it("renders EOA account details", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getBalance: vi.fn().mockResolvedValue(5000000000000000000n), // 5 ETH
      getCode: vi.fn().mockResolvedValue("0x"),
    } as any);

    renderWithRouter(<AccountPage />);
    await waitFor(() => {
      expect(screen.getByText(/Account Details/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/0x123/)).toBeInTheDocument();
    expect(screen.getAllByText(/5/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Externally Owned Account/i)).toBeInTheDocument();
  });

  it("renders Contract account details", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getBalance: vi.fn().mockResolvedValue(1000000000000000000n), // 1 ETH
      getCode: vi.fn().mockResolvedValue("0x60806040"), // Non-empty code means Contract
    } as any);

    renderWithRouter(<AccountPage />);
    await waitFor(() => {
      expect(screen.getByText(/Contract Bytecode/i)).toBeInTheDocument();
    });
    
    expect(screen.getAllByText(/1/).length).toBeGreaterThan(0);
    expect(screen.getByText(/0x60806040/)).toBeInTheDocument();
  });
});
