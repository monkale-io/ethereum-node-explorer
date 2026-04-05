import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TransactionLogs } from "../components/transaction/TransactionLogs";
import type { Log } from "viem";

// We mock useFourByteSignature at the module level to control 4byte behaviour per test
vi.mock("../hooks/useFourByteSignature", () => ({
  useFourByteSignature: vi.fn(),
}));

import * as fourByteHookModule from "../hooks/useFourByteSignature";

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const makeLog = (overrides: Partial<Log> = {}): Log => ({
  address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
  data: "0x",
  logIndex: 0,
  transactionIndex: 0,
  transactionHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  blockHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  blockNumber: 1n,
  removed: false,
  ...overrides,
});

// ERC-20 Transfer: topic[0]=sig, topic[1]=from, topic[2]=to, data=uint256(value)
const ERC20_TRANSFER_LOG = makeLog({
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8",
  ],
  data: "0x00000000000000000000000000000000000000000000000000000000000003e8",
});

// ERC-721 Transfer: topic[0]=sig, topic[1]=from, topic[2]=to, topic[3]=tokenId
const ERC721_TRANSFER_LOG = makeLog({
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8",
    "0x0000000000000000000000000000000000000000000000000000000000000042",
  ],
  data: "0x",
});

const UNKNOWN_LOG = makeLog({
  topics: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
  data: "0x",
});

// Default no-op hook return for locally decoded events (hook won't be called with a hash)
const noopHook = { name: null, loading: false };

beforeEach(() => {
  vi.mocked(fourByteHookModule.useFourByteSignature).mockReturnValue(noopHook);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Empty state ──────────────────────────────────────────────────────────────

describe("TransactionLogs – empty state", () => {
  it("renders empty message when logs array is empty", () => {
    renderWithRouter(<TransactionLogs logs={[]} use4byte={false} />);
    expect(screen.getByText(/No logs emitted by this transaction/i)).toBeInTheDocument();
  });
});

// ── Card title structure ─────────────────────────────────────────────────────

describe("TransactionLogs – card title structure", () => {
  it("card title is 'Event' for locally decoded log (not the event name)", () => {
    renderWithRouter(<TransactionLogs logs={[ERC20_TRANSFER_LOG]} use4byte={false} />);
    const cardTitle = document.querySelector('[data-slot="card-title"]');
    expect(cardTitle).toBeTruthy();
    expect(cardTitle).toHaveTextContent("Event");
    // The word "Transfer" should not appear in the card title
    expect(cardTitle).not.toHaveTextContent("Transfer");
  });

  it("card title is 'Event' for unknown log (not 'Log')", () => {
    renderWithRouter(<TransactionLogs logs={[UNKNOWN_LOG]} use4byte={false} />);
    const cardTitle = document.querySelector('[data-slot="card-title"]');
    expect(cardTitle).toBeTruthy();
    expect(cardTitle).toHaveTextContent("Event");
    expect(cardTitle).not.toHaveTextContent("Log");
  });

  it("badge shows logIndex in the card title", () => {
    renderWithRouter(<TransactionLogs logs={[makeLog({ logIndex: 7 })]} use4byte={false} />);
    expect(screen.getByText("#7")).toBeInTheDocument();
  });

  it("falls back to array index when logIndex is null", () => {
    renderWithRouter(<TransactionLogs logs={[makeLog({ logIndex: null })]} use4byte={false} />);
    expect(screen.getByText("#0")).toBeInTheDocument();
  });
});

// ── Event DetailRow – locally decoded ────────────────────────────────────────

describe("TransactionLogs – Event row, locally decoded", () => {
  it("shows Event label with Transfer badge for decoded ERC-20", () => {
    renderWithRouter(<TransactionLogs logs={[ERC20_TRANSFER_LOG]} use4byte={false} />);
    // The DetailRow label renders in a dt element
    expect(screen.getByText("Event", { selector: "dt" })).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
  });

  it("shows Transfer badge for decoded ERC-721 (4 topics)", () => {
    renderWithRouter(<TransactionLogs logs={[ERC721_TRANSFER_LOG]} use4byte={false} />);
    expect(screen.getByText("Transfer")).toBeInTheDocument();
    expect(screen.getByText("tokenId")).toBeInTheDocument();
    // tokenId 0x42 = 66
    expect(screen.getByText("66")).toBeInTheDocument();
  });

  it("decoded params still render for ERC-20 (from, to, value)", () => {
    renderWithRouter(<TransactionLogs logs={[ERC20_TRANSFER_LOG]} use4byte={false} />);
    expect(screen.getByText("from")).toBeInTheDocument();
    expect(screen.getByText("to")).toBeInTheDocument();
    expect(screen.getByText("value")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
  });

  it("does NOT call useFourByteSignature for locally known events even when use4byte=true", () => {
    renderWithRouter(<TransactionLogs logs={[ERC20_TRANSFER_LOG]} use4byte={true} />);
    // Hook was called but with topicHash=undefined (locally resolved, so no hash passed)
    const calls = vi.mocked(fourByteHookModule.useFourByteSignature).mock.calls;
    expect(calls.every(([hash]) => hash === undefined)).toBe(true);
  });

  it("shows Contract label for locally decoded event", () => {
    renderWithRouter(<TransactionLogs logs={[ERC20_TRANSFER_LOG]} use4byte={false} />);
    expect(screen.getByText("Contract")).toBeInTheDocument();
    expect(screen.queryByText("Address")).not.toBeInTheDocument();
  });
});

// ── Event DetailRow – unknown event, use4byte=false ──────────────────────────

describe("TransactionLogs – unknown event, use4byte=false", () => {
  it("shows 'Other' text with no Resolve button", () => {
    renderWithRouter(<TransactionLogs logs={[UNKNOWN_LOG]} use4byte={false} />);
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resolve/i })).not.toBeInTheDocument();
  });

  it("shows Address label for unknown event", () => {
    renderWithRouter(<TransactionLogs logs={[UNKNOWN_LOG]} use4byte={false} />);
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.queryByText("Contract")).not.toBeInTheDocument();
  });

  it("raw Event Sig and topics are shown for unknown event", () => {
    const topic = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    renderWithRouter(<TransactionLogs logs={[makeLog({ topics: [topic] })]} use4byte={false} />);
    expect(screen.getByText("Event Sig")).toBeInTheDocument();
    expect(screen.getByText(topic)).toBeInTheDocument();
  });
});

// ── Event DetailRow – unknown event, use4byte=true ───────────────────────────

describe("TransactionLogs – unknown event, use4byte=true", () => {
  it("auto-fetches and shows resolved name badge without user action", async () => {
    vi.mocked(fourByteHookModule.useFourByteSignature).mockReturnValue({
      name: "Deposit",
      loading: false,
    });
    renderWithRouter(<TransactionLogs logs={[UNKNOWN_LOG]} use4byte={true} />);
    await waitFor(() => expect(screen.getByText("Deposit")).toBeInTheDocument());
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
  });

  it("shows loading spinner while auto-fetching", () => {
    vi.mocked(fourByteHookModule.useFourByteSignature).mockReturnValue({
      name: null,
      loading: true,
    });
    renderWithRouter(<TransactionLogs logs={[UNKNOWN_LOG]} use4byte={true} />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows 'Other' with no Resolve button when 4byte returns empty", () => {
    vi.mocked(fourByteHookModule.useFourByteSignature).mockReturnValue({
      name: null,
      loading: false,
    });
    renderWithRouter(<TransactionLogs logs={[UNKNOWN_LOG]} use4byte={true} />);
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resolve/i })).not.toBeInTheDocument();
  });
});

// ── Contract name ────────────────────────────────────────────────────────────

describe("TransactionLogs – contract name", () => {
  it("shows contract name when provided in contractNames map", () => {
    renderWithRouter(
      <TransactionLogs
        logs={[ERC20_TRANSFER_LOG]}
        contractNames={{ [ERC20_TRANSFER_LOG.address]: "TestToken" }}
        use4byte={false}
      />,
    );
    expect(screen.getByText("TestToken")).toBeInTheDocument();
  });

  it("renders log address as link to account page", () => {
    const addr = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
    renderWithRouter(<TransactionLogs logs={[makeLog({ address: addr })]} use4byte={false} />);
    const link = screen.getByRole("link", { name: addr });
    expect(link).toHaveAttribute("href", `/account/${addr}`);
  });
});

// ── Raw data section ─────────────────────────────────────────────────────────

describe("TransactionLogs – raw data section", () => {
  it("hides Data row when data is 0x for unknown event", () => {
    vi.mocked(fourByteHookModule.useFourByteSignature).mockReturnValue(noopHook);
    renderWithRouter(<TransactionLogs logs={[UNKNOWN_LOG]} use4byte={false} />);
    expect(screen.queryByText("Data")).not.toBeInTheDocument();
  });

  it("shows Data row when data is non-0x for unknown event", () => {
    vi.mocked(fourByteHookModule.useFourByteSignature).mockReturnValue(noopHook);
    const data = "0x0000000000000000000000000000000000000000000000000000000000000001";
    renderWithRouter(
      <TransactionLogs
        logs={[makeLog({ topics: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"], data })]}
        use4byte={false}
      />,
    );
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText(data)).toBeInTheDocument();
  });

  it("shows Topic N labels for subsequent raw topics", () => {
    vi.mocked(fourByteHookModule.useFourByteSignature).mockReturnValue(noopHook);
    const log = makeLog({
      topics: [
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      ],
      data: "0x",
    });
    renderWithRouter(<TransactionLogs logs={[log]} use4byte={false} />);
    expect(screen.getByText("Topic 1")).toBeInTheDocument();
  });

  it("shows raw Event Sig and topics for 4byte-resolved event (no ABI)", () => {
    vi.mocked(fourByteHookModule.useFourByteSignature).mockReturnValue({
      name: "Deposit",
      loading: false,
    });
    const topic = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    renderWithRouter(<TransactionLogs logs={[makeLog({ topics: [topic] })]} use4byte={true} />);
    // Resolved name shown
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    // Raw event sig still shown (no local ABI decoding for 4byte-resolved events)
    expect(screen.getByText("Event Sig")).toBeInTheDocument();
  });
});

// ── knownEvents resolveEvent (direct lib test) ────────────────────────────────

describe("knownEvents – resolveEvent", () => {
  it("returns null for empty topics", async () => {
    const { resolveEvent } = await import("../lib/knownEvents");
    expect(resolveEvent([], "0x")).toBeNull();
  });

  it("returns null for unrecognised topic", async () => {
    const { resolveEvent } = await import("../lib/knownEvents");
    expect(
      resolveEvent(
        ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
        "0x",
      ),
    ).toBeNull();
  });

  it("resolves ERC-20 Transfer with correct param names and values", async () => {
    const { resolveEvent } = await import("../lib/knownEvents");
    const result = resolveEvent(
      [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8",
      ],
      "0x00000000000000000000000000000000000000000000000000000000000003e8",
    );
    expect(result?.name).toBe("Transfer");
    expect(result?.params.find((p) => p.name === "value")?.value).toBe("1000");
  });

  it("resolves ERC-721 Transfer (4 topics) with tokenId param", async () => {
    const { resolveEvent } = await import("../lib/knownEvents");
    const result = resolveEvent(
      [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8",
        "0x0000000000000000000000000000000000000000000000000000000000000042",
      ],
      "0x",
    );
    expect(result?.name).toBe("Transfer");
    expect(result?.params.find((p) => p.name === "tokenId")?.value).toBe("66");
  });
});
