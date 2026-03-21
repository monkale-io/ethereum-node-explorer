import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

describe("cn", () => {
  it("merges classes", () => {
    expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500");
  });
  it("handles conditional classes", () => {
    const enabledClass = "bg-red-500";
    const disabledClass = undefined;

    expect(cn("px-2 py-1", enabledClass, disabledClass)).toBe(
      "px-2 py-1 bg-red-500",
    );
  });
  it("merges tailwind classes intelligently", () => {
    expect(cn("px-2 py-1 bg-red-500", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
    expect(cn("p-4 p-2")).toBe("p-2");
  });
});
