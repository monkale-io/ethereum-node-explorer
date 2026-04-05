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

const baseStore = {
  rpcUrl: "http://old",
  dialogOpen: true,
  use4byte: true,
  setRpcUrl: vi.fn(),
  setDialogOpen: vi.fn(),
  setUse4byte: vi.fn(),
};

describe("ConfigureRpcDialog", () => {
  it("renders and tests connection successfully", async () => {
    const setRpcUrlMock = vi.fn();
    const setDialogOpenMock = vi.fn();
    (useConfigStore as any).mockReturnValue({
      ...baseStore,
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
    (useConfigStore as any).mockReturnValue({ ...baseStore });

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
      ...baseStore,
      setRpcUrl: setRpcUrlMock,
      setDialogOpen: setDialogOpenMock,
    });

    render(<ConfigureRpcDialog />);
    
    const disconnectButton = screen.getByText("Disconnect");
    fireEvent.click(disconnectButton);

    expect(setRpcUrlMock).toHaveBeenCalledWith("");
    expect(setDialogOpenMock).toHaveBeenCalledWith(false);
  });

  it("renders 4byte toggle checkbox and description", () => {
    (useConfigStore as any).mockReturnValue({ ...baseStore, use4byte: true });
    render(<ConfigureRpcDialog />);

    expect(screen.getByLabelText(/Resolve unknown events via 4byte.directory/i)).toBeInTheDocument();
    expect(screen.getByText(/human-readable/i)).toBeInTheDocument();
  });

  it("checkbox is checked when use4byte is true", () => {
    (useConfigStore as any).mockReturnValue({ ...baseStore, use4byte: true });
    render(<ConfigureRpcDialog />);

    const checkbox = screen.getByLabelText(/Resolve unknown events via 4byte.directory/i);
    expect(checkbox).toBeChecked();
  });

  it("checkbox is unchecked when use4byte is false", () => {
    (useConfigStore as any).mockReturnValue({ ...baseStore, use4byte: false });
    render(<ConfigureRpcDialog />);

    const checkbox = screen.getByLabelText(/Resolve unknown events via 4byte.directory/i);
    expect(checkbox).not.toBeChecked();
  });

  it("clicking checkbox calls setUse4byte(false) when currently true", () => {
    const setUse4byteMock = vi.fn();
    (useConfigStore as any).mockReturnValue({ ...baseStore, use4byte: true, setUse4byte: setUse4byteMock });
    render(<ConfigureRpcDialog />);

    const checkbox = screen.getByLabelText(/Resolve unknown events via 4byte.directory/i);
    fireEvent.click(checkbox);

    expect(setUse4byteMock).toHaveBeenCalledWith(false);
  });

  it("clicking checkbox calls setUse4byte(true) when currently false", () => {
    const setUse4byteMock = vi.fn();
    (useConfigStore as any).mockReturnValue({ ...baseStore, use4byte: false, setUse4byte: setUse4byteMock });
    render(<ConfigureRpcDialog />);

    const checkbox = screen.getByLabelText(/Resolve unknown events via 4byte.directory/i);
    fireEvent.click(checkbox);

    expect(setUse4byteMock).toHaveBeenCalledWith(true);
  });
});
