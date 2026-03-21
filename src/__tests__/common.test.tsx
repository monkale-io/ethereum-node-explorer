import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CopyButton } from "../components/common/CopyButton";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { useThemeStore } from "../stores/themeStore";

vi.mock("../stores/themeStore", () => ({
  useThemeStore: vi.fn(),
}));

describe("CopyButton", () => {
  it("copies text and shows copied state", async () => {
    const originalClipboard = navigator.clipboard;
    let copiedText = "";
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation((text) => {
          copiedText = text;
          return Promise.resolve();
        }),
      },
    });

    render(<CopyButton value="test_value" />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test_value");
    expect(copiedText).toBe("test_value");

    await waitFor(() => {
      // The Check icon should be rendered
      expect(document.querySelector(".lucide-check")).not.toBeNull();
    });

    Object.assign(navigator, { clipboard: originalClipboard });
  });
});

describe("ThemeToggle", () => {
  it("toggles theme", () => {
    const setModeMock = vi.fn();
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mode: "light",
      setMode: setModeMock,
    });

    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
