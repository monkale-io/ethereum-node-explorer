import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

const ThrowError = () => {
  throw new Error("Test error");
  return null;
};

// Suppress console.error for expected errors in ErrorBoundary
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0] && args[0].includes("ErrorBoundary caught")) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(<ErrorBoundary><div>Safe</div></ErrorBoundary>);
    expect(screen.getByText("Safe")).toBeInTheDocument();
  });

  it("renders error state when error caught and allows reset", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText("Test error")).toBeInTheDocument();
    
    // Test clicking reset
    const btn = screen.getByText("Try Again");
    fireEvent.click(btn);
  });

  it("renders fallback if provided", () => {
    render(
      <ErrorBoundary fallback={<div>Fallback UI</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText("Fallback UI")).toBeInTheDocument();
  });
});
