import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../App";

// Mock resize observer and matchMedia for Recharts/Tailwind
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it("renders logo and GPL license link", () => {
    render(<App />);

    expect(screen.getAllByAltText("Monkale Logo").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "GNU General Public License v3.0" }),
    ).toHaveAttribute(
      "href",
      "https://www.gnu.org/licenses/gpl-3.0.en.html#license-text",
    );
  });
});
