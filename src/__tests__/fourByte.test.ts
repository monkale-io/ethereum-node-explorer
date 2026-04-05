import { describe, it, expect, vi, beforeEach } from "vitest";

const HASH = "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c";
const HASH2 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function makeFetchOk(textSignature: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results: [{ text_signature: textSignature }] }),
  });
}

function makeFetchEmpty() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results: [] }),
  });
}

function makeFetchNotOk() {
  return vi.fn().mockResolvedValue({ ok: false });
}

function makeFetchThrows() {
  return vi.fn().mockRejectedValue(new Error("Network error"));
}

// Each test gets a fresh module (and thus a fresh cache Map)
async function freshLookup() {
  vi.resetModules();
  const mod = await import("../lib/fourByte");
  return mod.lookupEventSignature;
}

describe("lookupEventSignature", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns event name from text_signature", async () => {
    vi.stubGlobal("fetch", makeFetchOk("Deposit(address,uint256)"));
    const lookupEventSignature = await freshLookup();
    const result = await lookupEventSignature(HASH);
    expect(result).toBe("Deposit");
  });

  it("returns null when results is empty", async () => {
    vi.stubGlobal("fetch", makeFetchEmpty());
    const lookupEventSignature = await freshLookup();
    const result = await lookupEventSignature(HASH);
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    vi.stubGlobal("fetch", makeFetchThrows());
    const lookupEventSignature = await freshLookup();
    const result = await lookupEventSignature(HASH);
    expect(result).toBeNull();
  });

  it("returns null on non-ok HTTP response", async () => {
    vi.stubGlobal("fetch", makeFetchNotOk());
    const lookupEventSignature = await freshLookup();
    const result = await lookupEventSignature(HASH);
    expect(result).toBeNull();
  });

  it("caches result and does not fetch twice for same hash", async () => {
    const mockFetch = makeFetchOk("Deposit(address,uint256)");
    vi.stubGlobal("fetch", mockFetch);
    const lookupEventSignature = await freshLookup();
    await lookupEventSignature(HASH);
    await lookupEventSignature(HASH);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("caches null for not-found and does not re-fetch", async () => {
    const mockFetch = makeFetchEmpty();
    vi.stubGlobal("fetch", mockFetch);
    const lookupEventSignature = await freshLookup();
    await lookupEventSignature(HASH);
    await lookupEventSignature(HASH);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("different hashes trigger separate fetches", async () => {
    const mockFetch = makeFetchOk("Transfer(address,address,uint256)");
    vi.stubGlobal("fetch", mockFetch);
    const lookupEventSignature = await freshLookup();
    await lookupEventSignature(HASH);
    await lookupEventSignature(HASH2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("concurrent calls for same hash only trigger one fetch", async () => {
    const mockFetch = makeFetchOk("Deposit(address,uint256)");
    vi.stubGlobal("fetch", mockFetch);
    const lookupEventSignature = await freshLookup();
    const [r1, r2] = await Promise.all([lookupEventSignature(HASH), lookupEventSignature(HASH)]);
    expect(r1).toBe("Deposit");
    expect(r2).toBe("Deposit");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
