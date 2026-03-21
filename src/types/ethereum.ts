export interface SyncStatus {
  startingBlock: bigint;
  currentBlock: bigint;
  highestBlock: bigint;
}

export interface NodeStatus {
  isConnected: boolean;
  chainId: number | null;
  clientVersion: string | null;
  peerCount: number | null;
  syncStatus: SyncStatus | false | null;
  latestBlockNumber: bigint | null;
}
