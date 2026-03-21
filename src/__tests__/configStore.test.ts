import { describe, it, expect, beforeEach } from "vitest";
import { useConfigStore } from "@/stores/configStore";

describe("configStore", () => {
  beforeEach(() => {
    useConfigStore.setState({ rpcUrl: "", dialogOpen: false });
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
});
