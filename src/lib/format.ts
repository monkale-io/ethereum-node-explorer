import { formatEther } from "viem";

export function truncateHash(hash: string, startLen = 6, endLen = 4): string {
  if (hash.length <= startLen + endLen + 2) return hash;
  return `${hash.slice(0, startLen + 2)}...${hash.slice(-endLen)}`;
}

export function formatWei(wei: bigint): string {
  return formatEther(wei);
}

export function formatEth(wei: bigint, decimals = 4): string {
  const eth = Number(formatEther(wei));
  return `${eth.toLocaleString(undefined, { maximumFractionDigits: decimals })} ETH`;
}

export function formatGas(gas: bigint): string {
  return Number(gas).toLocaleString();
}

export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

export function timeAgo(timestamp: bigint): string {
  const seconds = Math.floor(Date.now() / 1000 - Number(timestamp));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function detectSearchInput(
  input: string,
): "block" | "transaction" | "address" | "unknown" {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return "block";
  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) return "transaction";
  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return "address";
  return "unknown";
}

export function chainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: "Mainnet",
    5: "Goerli",
    11155111: "Sepolia",
    17000: "Holesky",
    31337: "Hardhat",
    1337: "Local Dev",
  };
  return chains[chainId] ?? `Chain ${chainId}`;
}
