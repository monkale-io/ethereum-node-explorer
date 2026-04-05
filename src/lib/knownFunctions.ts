import { decodeFunctionData } from "viem";

export type ResolvedParam = { name: string; type: string; value: string };
export type ResolvedFunction = { name: string; params: ResolvedParam[] };

type FunctionInput = { readonly name: string; readonly type: string };

type FunctionDef = {
  name: string;
  inputs: readonly FunctionInput[];
};

const KNOWN_FUNCTIONS: Record<string, FunctionDef> = {
  "0xa9059cbb": { // transfer(address,uint256)
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
  },
  "0x095ea7b3": { // approve(address,uint256)
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
  },
  "0x23b872dd": { // transferFrom(address,address,uint256)
    name: "transferFrom",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
  },
};

function formatValue(value: unknown, type: string): string {
  if (type === "bool") return value ? "true" : "false";
  if (type === "uint256[]") return `[${(value as bigint[]).join(", ")}]`;
  return String(value);
}

export function resolveFunction(data: `0x${string}`): ResolvedFunction | null {
  if (!data || data.length < 10) return null;
  const selector = data.slice(0, 10).toLowerCase();

  const def = KNOWN_FUNCTIONS[selector];
  if (!def) return null;

  try {
    const abi = [{
      type: "function" as const,
      name: def.name,
      inputs: def.inputs,
      outputs: [],
      stateMutability: "nonpayable" as const,
    }];
    
    const decoded = decodeFunctionData({ abi, data });
    
    if (!decoded.args) return { name: def.name, params: [] };

    // viem returns an array or tuple of args matching the ABI inputs order
    const argsArray = Array.isArray(decoded.args) ? decoded.args : [decoded.args];
    
    const params = def.inputs.map((input, i) => ({
      name: input.name,
      type: input.type,
      value: formatValue(argsArray[i], input.type),
    }));
    
    return { name: def.name, params };
  } catch {
    return null;
  }
}
