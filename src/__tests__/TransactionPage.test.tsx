import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TransactionPage } from "../components/transaction/TransactionPage";
import * as useEthereumModule from "../hooks/useEthereum";
import * as configStoreModule from "../stores/configStore";
import * as TransactionLogsModule from "../components/transaction/TransactionLogs";

vi.mock("../hooks/useEthereum", () => ({
  useEthereum: vi.fn(),
}));

vi.mock("../stores/configStore", () => ({
  useConfigStore: vi.fn(),
}));

describe("TransactionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configStoreModule.useConfigStore).mockReturnValue({
      rpcUrl: "http://localhost:8545",
      dialogOpen: false,
      use4byte: true,
      setRpcUrl: vi.fn(),
      setDialogOpen: vi.fn(),
      setUse4byte: vi.fn(),
    } as any);
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
        logs: [],
      }),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
      getContractName: vi.fn().mockResolvedValue(null),
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

  it("shows Overview and Logs tab triggers after loading", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getTransaction: vi.fn().mockResolvedValue({
        hash: "0x123",
        blockNumber: 100n,
        from: "0xabc",
        to: "0xdef",
        value: 0n,
        gas: 21000n,
        nonce: 0,
        input: "0x",
      }),
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success",
        gasUsed: 21000n,
        effectiveGasPrice: 1000000000n,
        contractAddress: null,
        logs: [],
      }),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
      getContractName: vi.fn().mockResolvedValue(null),
    } as any);

    renderWithRouter(<TransactionPage />);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Overview/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: /Logs \(0\)/i })).toBeInTheDocument();
  });

  it("Logs tab shows empty state when receipt has no logs", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getTransaction: vi.fn().mockResolvedValue({
        hash: "0x123",
        blockNumber: 100n,
        from: "0xabc",
        to: "0xdef",
        value: 0n,
        gas: 21000n,
        nonce: 0,
        input: "0x",
      }),
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success",
        gasUsed: 21000n,
        effectiveGasPrice: 1000000000n,
        contractAddress: null,
        logs: [],
      }),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
      getContractName: vi.fn().mockResolvedValue(null),
    } as any);

    renderWithRouter(<TransactionPage />);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Logs \(0\)/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("tab", { name: /Logs \(0\)/i }));
    expect(screen.getByText(/No logs emitted by this transaction/i)).toBeInTheDocument();
  });

  it("Logs tab renders log entry with address and Event Sig", async () => {
    const CONTRACT = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
    const TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getTransaction: vi.fn().mockResolvedValue({
        hash: "0x123",
        blockNumber: 100n,
        from: "0xabc",
        to: CONTRACT,
        value: 0n,
        gas: 21000n,
        nonce: 0,
        input: "0x",
      }),
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success",
        gasUsed: 21000n,
        effectiveGasPrice: 1000000000n,
        contractAddress: null,
        logs: [
          {
            address: CONTRACT,
            topics: [TOPIC],
            data: "0x",
            logIndex: 0,
            transactionIndex: 0,
            transactionHash: "0x123",
            blockHash: "0xabc",
            blockNumber: 100n,
            removed: false,
          },
        ],
      }),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
      getContractName: vi.fn().mockResolvedValue("TestToken"),
    } as any);

    renderWithRouter(<TransactionPage />);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Logs \(1\)/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("tab", { name: /Logs \(1\)/i }));
    expect(screen.getByRole("link", { name: CONTRACT })).toBeInTheDocument();
    expect(screen.getByText("Event Sig")).toBeInTheDocument();
    expect(screen.getByText(TOPIC)).toBeInTheDocument();
    // Contract name from the mock
    expect(screen.getByText("TestToken")).toBeInTheDocument();
  });

  it("passes use4byte=true to TransactionLogs when store has use4byte=true", async () => {
    const logsSpy = vi.spyOn(TransactionLogsModule, "TransactionLogs");
    vi.mocked(configStoreModule.useConfigStore).mockReturnValue({
      rpcUrl: "http://localhost:8545",
      dialogOpen: false,
      use4byte: true,
      setRpcUrl: vi.fn(),
      setDialogOpen: vi.fn(),
      setUse4byte: vi.fn(),
    } as any);
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getTransaction: vi.fn().mockResolvedValue({
        hash: "0x123", blockNumber: 100n, from: "0xabc", to: "0xdef",
        value: 0n, gas: 21000n, nonce: 0, input: "0x",
      }),
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success", gasUsed: 21000n, effectiveGasPrice: 1000000000n,
        contractAddress: null, logs: [],
      }),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
      getContractName: vi.fn().mockResolvedValue(null),
    } as any);

    renderWithRouter(<TransactionPage />);
    await waitFor(() => expect(screen.getByRole("tab", { name: /Logs/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("tab", { name: /Logs/i }));

    const firstCallProps = logsSpy.mock.calls[0]?.[0];
    expect(firstCallProps).toBeDefined();
    expect(firstCallProps).toMatchObject({ use4byte: true });
  });

  it("passes use4byte=false to TransactionLogs when store is opted out", async () => {
    const logsSpy = vi.spyOn(TransactionLogsModule, "TransactionLogs");
    vi.mocked(configStoreModule.useConfigStore).mockReturnValue({
      rpcUrl: "http://localhost:8545",
      dialogOpen: false,
      use4byte: false,
      setRpcUrl: vi.fn(),
      setDialogOpen: vi.fn(),
      setUse4byte: vi.fn(),
    } as any);
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getTransaction: vi.fn().mockResolvedValue({
        hash: "0x123", blockNumber: 100n, from: "0xabc", to: "0xdef",
        value: 0n, gas: 21000n, nonce: 0, input: "0x",
      }),
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success", gasUsed: 21000n, effectiveGasPrice: 1000000000n,
        contractAddress: null, logs: [],
      }),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
      getContractName: vi.fn().mockResolvedValue(null),
    } as any);

    renderWithRouter(<TransactionPage />);
    await waitFor(() => expect(screen.getByRole("tab", { name: /Logs/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("tab", { name: /Logs/i }));

    const firstCallProps = logsSpy.mock.calls[0]?.[0];
    expect(firstCallProps).toBeDefined();
    expect(firstCallProps).toMatchObject({ use4byte: false });
  });

  it("shows contract interaction details in Overview", async () => {
    vi.spyOn(useEthereumModule, "useEthereum").mockReturnValue({
      getTransaction: vi.fn().mockResolvedValue({
        hash: "0x123",
        blockNumber: 100n,
        from: "0xabc",
        to: "0xdef",
        value: 0n,
        gas: 21000n,
        nonce: 0,
        input: "0xa9059cbb00000000000000000000000024dee12a4a8ab44df547909e1ef8d9a660bf36ae0000000000000000000000000000000000000000000000000000000002160ec0",
      }),
      getTransactionReceipt: vi.fn().mockResolvedValue({
        status: "success",
        gasUsed: 21000n,
        effectiveGasPrice: 1000000000n,
        contractAddress: null,
        logs: [],
      }),
      getLatestBlockNumber: vi.fn().mockResolvedValue(105n),
      getContractName: vi.fn().mockResolvedValue("MockToken"),
    } as any);

    renderWithRouter(<TransactionPage />);
    await waitFor(() => {
      expect(screen.getByText("Interacted With")).toBeInTheDocument();
    });

    // Check that contract name is displayed
    expect(screen.getByText("MockToken")).toBeInTheDocument();
    
    // Check that method name is displayed
    expect(screen.getByText("Method")).toBeInTheDocument();
    expect(screen.getByText("transfer")).toBeInTheDocument();

    // Check that decoded recipient is displayed
    expect(screen.getByText("Recipient")).toBeInTheDocument();
    expect(screen.getByText("0x24dee12A4A8Ab44DF547909E1ef8d9A660BF36Ae", { exact: false })).toBeInTheDocument();
  });
});
