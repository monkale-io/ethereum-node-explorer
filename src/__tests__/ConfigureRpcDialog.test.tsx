import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfigureRpcDialog } from "../components/common/ConfigureRpcDialog";
import { useConfigStore } from "../stores/configStore";
import { EthereumService } from "../services/EthereumService";

vi.mock("../stores/configStore", () => ({
  useConfigStore: vi.fn(),
}));

vi.mock("../services/EthereumService", () => ({
  EthereumService: vi.fn(function() { return {}; }),
}));

describe("ConfigureRpcDialog", () => {
  it("renders and tests connection successfully", async () => {
    const setRpcUrlMock = vi.fn();
    const setDialogOpenMock = vi.fn();
    (useConfigStore as any).mockReturnValue({
      rpcUrl: "http://old",
      dialogOpen: true,
      setRpcUrl: setRpcUrlMock,
      setDialogOpen: setDialogOpenMock,
    });

    const mockTestConnection = vi.fn().mockResolvedValue({ success: true, chainId: 1 });
    (EthereumService as any).mockImplementation(function() {
      return {
        testConnection: mockTestConnection
      };
    });

    render(<ConfigureRpcDialog />);
    expect(screen.getByText("Configure RPC Endpoint")).toBeInTheDocument();

    const input = screen.getByLabelText("RPC URL");
    fireEvent.change(input, { target: { value: "http://new" } });

    // Test pressing enter
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText(/Connected! Chain ID: 1/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Save"));
    expect(setRpcUrlMock).toHaveBeenCalledWith("http://new");
  });

  it("handles test connection error", async () => {
    (useConfigStore as any).mockReturnValue({
      rpcUrl: "http://old",
      dialogOpen: true,
      setRpcUrl: vi.fn(),
      setDialogOpen: vi.fn(),
    });

    const mockTestConnection = vi.fn().mockResolvedValue({ success: false, error: "Network Error" });
    (EthereumService as any).mockImplementation(function() {
      return {
        testConnection: mockTestConnection
      };
    });

    render(<ConfigureRpcDialog />);
    const input = screen.getByLabelText("RPC URL");
    fireEvent.change(input, { target: { value: "http://error" } });

    fireEvent.click(screen.getByText("Test Connection"));

    await waitFor(() => {
      expect(screen.getByText(/Network Error/)).toBeInTheDocument();
    });
  });

  it("disconnects the RPC endpoint", () => {
    const setRpcUrlMock = vi.fn();
    const setDialogOpenMock = vi.fn();
    (useConfigStore as any).mockReturnValue({
      rpcUrl: "http://old",
      dialogOpen: true,
      setRpcUrl: setRpcUrlMock,
      setDialogOpen: setDialogOpenMock,
    });

    render(<ConfigureRpcDialog />);
    
    const disconnectButton = screen.getByText("Disconnect");
    fireEvent.click(disconnectButton);

    expect(setRpcUrlMock).toHaveBeenCalledWith("");
    expect(setDialogOpenMock).toHaveBeenCalledWith(false);
  });
});
