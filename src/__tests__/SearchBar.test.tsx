import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SearchBar } from "@/components/common/SearchBar";

function renderSearchBar() {
  return render(
    <MemoryRouter>
      <SearchBar />
    </MemoryRouter>,
  );
}

describe("SearchBar", () => {
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
});
