import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "../components/dashboard/DashboardPage";
import * as configStore from "../stores/configStore";
import * as dashboardLive from "../hooks/useDashboardLive";

vi.mock("../stores/configStore", () => ({
  useConfigStore: vi.fn(),
}));

vi.mock("../hooks/useDashboardLive", () => ({
  useDashboardLive: vi.fn(),
}));

// We need an IntersectionObserver mock for Recharts (used by BlocksTxChart if Recharts is what it uses, or Framer Motion)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it("renders configuration prompt when no rpcUrl is set", () => {
    const setDialogOpen = vi.fn();
    vi.spyOn(configStore, "useConfigStore").mockReturnValue({
      rpcUrl: "",
      setDialogOpen,
    } as any);

    vi.spyOn(dashboardLive, "useDashboardLive").mockReturnValue({
      latestBlockNumber: null,
      blocks: [],
      status: null,
      error: null,
      loading: false,
      lastUpdated: null,
    });

    renderWithRouter(<DashboardPage />);
    const configBtn = screen.getByText(/Configure RPC Endpoint/i);
    expect(configBtn).toBeInTheDocument();
    
    fireEvent.click(configBtn);
    expect(setDialogOpen).toHaveBeenCalledWith(true);
  });

  it("renders dashboard live view when rpcUrl is set", () => {
    vi.spyOn(configStore, "useConfigStore").mockReturnValue({
      rpcUrl: "http://localhost:8545",
      setDialogOpen: vi.fn(),
    } as any);

    vi.spyOn(dashboardLive, "useDashboardLive").mockReturnValue({
      latestBlockNumber: 100n,
      blocks: [
        { number: 100n, hash: "0x123", timestamp: 1700000000n, transactions: ["0xa", "0xb"] } as any,
        { number: 99n, hash: "0x122", timestamp: 1700000000n, transactions: [] } as any,
      ],
      status: {
        isConnected: true,
        chainId: 1,
        clientVersion: "Geth/1.0",
        peerCount: 10,
        syncStatus: false,
        latestBlockNumber: 100n,
      },
      error: null,
      loading: false,
      lastUpdated: Date.now(),
    });

    renderWithRouter(<DashboardPage />);
    
    // Check NodeStatusCard elements
    expect(screen.getByText(/Node Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Geth\/1.0/i)).toBeInTheDocument();
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();

    // Check LatestBlocksCard elements
    expect(screen.getByText(/Latest Blocks/i)).toBeInTheDocument();
    // Assuming Block number is rendered
    expect(screen.getAllByText(/100/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/99/).length).toBeGreaterThan(0);
  });

  it("renders loading state", () => {
    vi.spyOn(configStore, "useConfigStore").mockReturnValue({
      rpcUrl: "http://localhost:8545",
      setDialogOpen: vi.fn(),
    } as any);

    vi.spyOn(dashboardLive, "useDashboardLive").mockReturnValue({
      latestBlockNumber: null,
      blocks: [],
      status: null,
      error: null,
      loading: true,
      lastUpdated: null,
    });

    const { container } = renderWithRouter(<DashboardPage />);
    // Simple verification that it renders without crashing
    expect(container).toBeInTheDocument();
  });

  it("renders error state", () => {
    const setDialogOpen = vi.fn();
    vi.spyOn(configStore, "useConfigStore").mockReturnValue({
      rpcUrl: "http://localhost:8545",
      setDialogOpen,
    } as any);

    vi.spyOn(dashboardLive, "useDashboardLive").mockReturnValue({
      latestBlockNumber: null,
      blocks: [],
      status: null,
      error: "Connection refused",
      loading: false,
      lastUpdated: null,
    });

    renderWithRouter(<DashboardPage />);
    expect(screen.getByText(/Connection Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Connection refused/i)).toBeInTheDocument();
    
    const reconfigureBtn = screen.getByText(/Reconfigure RPC Endpoint/i);
    expect(reconfigureBtn).toBeInTheDocument();
    
    fireEvent.click(reconfigureBtn);
    expect(setDialogOpen).toHaveBeenCalledWith(true);
  });
});
