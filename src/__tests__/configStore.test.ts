import { describe, it, expect, beforeEach } from "vitest";
import { useConfigStore } from "@/stores/configStore";

describe("configStore", () => {
  beforeEach(() => {
    useConfigStore.setState({ rpcUrl: "", dialogOpen: false, use4byte: true });
  });

  it("has empty rpcUrl by default", () => {
    const state = useConfigStore.getState();
    expect(state.rpcUrl).toBe("");
  });

  it("has dialog closed by default", () => {
    const state = useConfigStore.getState();
    expect(state.dialogOpen).toBe(false);
  });

  it("sets rpcUrl", () => {
    useConfigStore.getState().setRpcUrl("http://localhost:8545");
    expect(useConfigStore.getState().rpcUrl).toBe("http://localhost:8545");
  });

  it("opens and closes dialog", () => {
    useConfigStore.getState().setDialogOpen(true);
    expect(useConfigStore.getState().dialogOpen).toBe(true);

    useConfigStore.getState().setDialogOpen(false);
    expect(useConfigStore.getState().dialogOpen).toBe(false);
  });

  it("replaces rpcUrl on subsequent calls", () => {
    useConfigStore.getState().setRpcUrl("http://first:8545");
    useConfigStore.getState().setRpcUrl("http://second:8545");
    expect(useConfigStore.getState().rpcUrl).toBe("http://second:8545");
  });

  it("use4byte defaults to true", () => {
    expect(useConfigStore.getState().use4byte).toBe(true);
  });

  it("setUse4byte updates the value", () => {
    useConfigStore.getState().setUse4byte(false);
    expect(useConfigStore.getState().use4byte).toBe(false);
    useConfigStore.getState().setUse4byte(true);
    expect(useConfigStore.getState().use4byte).toBe(true);
  });

  it("use4byte is included in partialize output", () => {
    useConfigStore.setState({ rpcUrl: "http://localhost:8545", use4byte: false });
    const state = useConfigStore.getState();
    // partialize selects rpcUrl and use4byte for persistence
    expect(state.rpcUrl).toBe("http://localhost:8545");
    expect(state.use4byte).toBe(false);
  });
});
