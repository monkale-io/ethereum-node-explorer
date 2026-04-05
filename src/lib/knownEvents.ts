import { decodeEventLog } from "viem";

export type ResolvedParam = { name: string; type: string; value: string };
export type ResolvedEvent = { name: string; params: ResolvedParam[] };

type EventInput = { readonly name: string; readonly type: string; readonly indexed: boolean };

type EventDef = {
  name: string;
  topicCount: number;
  inputs: readonly EventInput[];
};

// precomputed keccak256 topic hashes for well-known ERC events

// Transfer(address,address,uint256) — ERC-20 (topicCount=3) and ERC-721 (topicCount=4)
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
// Approval(address,address,uint256) — ERC-20 (topicCount=3) and ERC-721 (topicCount=4)
const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
// ApprovalForAll(address,address,bool)
const APPROVAL_FOR_ALL_TOPIC = "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31";
// TransferSingle(address,address,address,uint256,uint256)
const TRANSFER_SINGLE_TOPIC = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";
// TransferBatch(address,address,address,uint256[],uint256[])
const TRANSFER_BATCH_TOPIC = "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";

const KNOWN_EVENTS: Record<string, EventDef[]> = {
  [TRANSFER_TOPIC]: [
    {
      name: "Transfer",
      topicCount: 3,
      inputs: [
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "value", type: "uint256", indexed: false },
      ],
    },
    {
      name: "Transfer",
      topicCount: 4,
      inputs: [
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "tokenId", type: "uint256", indexed: true },
      ],
    },
  ],
  [APPROVAL_TOPIC]: [
    {
      name: "Approval",
      topicCount: 3,
      inputs: [
        { name: "owner", type: "address", indexed: true },
        { name: "spender", type: "address", indexed: true },
        { name: "value", type: "uint256", indexed: false },
      ],
    },
    {
      name: "Approval",
      topicCount: 4,
      inputs: [
        { name: "owner", type: "address", indexed: true },
        { name: "approved", type: "address", indexed: true },
        { name: "tokenId", type: "uint256", indexed: true },
      ],
    },
  ],
  [APPROVAL_FOR_ALL_TOPIC]: [
    {
      name: "ApprovalForAll",
      topicCount: 3,
      inputs: [
        { name: "owner", type: "address", indexed: true },
        { name: "operator", type: "address", indexed: true },
        { name: "approved", type: "bool", indexed: false },
      ],
    },
  ],
  [TRANSFER_SINGLE_TOPIC]: [
    {
      name: "TransferSingle",
      topicCount: 4,
      inputs: [
        { name: "operator", type: "address", indexed: true },
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "id", type: "uint256", indexed: false },
        { name: "value", type: "uint256", indexed: false },
      ],
    },
  ],
  [TRANSFER_BATCH_TOPIC]: [
    {
      name: "TransferBatch",
      topicCount: 4,
      inputs: [
        { name: "operator", type: "address", indexed: true },
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "ids", type: "uint256[]", indexed: false },
        { name: "values", type: "uint256[]", indexed: false },
      ],
    },
  ],
};

function formatValue(value: unknown, type: string): string {
  if (type === "bool") return value ? "true" : "false";
  if (type === "uint256[]") return `[${(value as bigint[]).join(", ")}]`;
  return String(value);
}

export function resolveEvent(
  topics: readonly `0x${string}`[],
  data: `0x${string}`,
): ResolvedEvent | null {
  const topic0 = topics[0];
  if (!topic0) return null;

  const candidates = KNOWN_EVENTS[topic0];
  if (!candidates) return null;

  for (const def of candidates) {
    if (topics.length !== def.topicCount) continue;
    try {
      const abi = [{ type: "event" as const, name: def.name, inputs: def.inputs }];
      const decoded = decodeEventLog({
        abi,
        data,
        topics: topics as [`0x${string}`, ...`0x${string}`[]],
      });
      const args = decoded.args as Record<string, unknown>;
      const params = def.inputs.map((input) => ({
        name: input.name,
        type: input.type,
        value: formatValue(args[input.name], input.type),
      }));
      return { name: def.name, params };
    } catch {
      // wrong candidate (e.g. data mismatch), try next
    }
  }

  return null;
}
