import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { SearchBar } from "@/components/common/SearchBar";
import { useEthereum } from "@/hooks/useEthereum";

vi.mock("@/hooks/useEthereum", () => ({
  useEthereum: vi.fn(),
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
}

function renderSearchBar() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<SearchBar />} />
        <Route path="*" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SearchBar", () => {
  const mockResolveEnsName = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEthereum as any).mockReturnValue({
      resolveEnsName: mockResolveEnsName,
    });
  });

  it("renders the search input", () => {
    renderSearchBar();
    expect(
      screen.getByPlaceholderText(/search by block number/i),
    ).toBeInTheDocument();
  });

  it("renders the search button", () => {
    renderSearchBar();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("disables button when input is empty", () => {
    renderSearchBar();
    expect(screen.getByRole("button", { name: /search/i })).toBeDisabled();
  });

  it("enables button when input has text", async () => {
    renderSearchBar();
    const input = screen.getByPlaceholderText(/search by block number/i);
    await userEvent.type(input, "123456");
    expect(screen.getByRole("button", { name: /search/i })).not.toBeDisabled();
  });

  it("resolves ENS name and navigates to account", async () => {
    mockResolveEnsName.mockResolvedValue("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
    renderSearchBar();
    
    const input = screen.getByPlaceholderText(/search by block number/i);
    await userEvent.type(input, "vitalik.eth{enter}");
    
    await waitFor(() => {
      expect(screen.getByTestId("location-display")).toHaveTextContent("/account/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
    });
    
    expect(mockResolveEnsName).toHaveBeenCalledWith("vitalik.eth");
  });

  it("shows error when ENS name is not found", async () => {
    mockResolveEnsName.mockResolvedValue(null);
    renderSearchBar();
    
    const input = screen.getByPlaceholderText(/search by block number/i);
    await userEvent.type(input, "unknown.eth{enter}");

    await waitFor(() => {
      expect(screen.getByText("ENS name not found")).toBeInTheDocument();
    });
    
    // Error clears on next typing
    await userEvent.type(input, "a");
    expect(screen.queryByText("ENS name not found")).not.toBeInTheDocument();
  });

  it("navigates directly for block numbers without ENS resolution", async () => {
    renderSearchBar();
    
    const input = screen.getByPlaceholderText(/search by block number/i);
    await userEvent.type(input, "123456{enter}");

    await waitFor(() => {
      expect(screen.getByTestId("location-display")).toHaveTextContent("/block/123456");
    });
    expect(mockResolveEnsName).not.toHaveBeenCalled();
  });
});
