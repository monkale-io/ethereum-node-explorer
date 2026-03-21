import { useState, useEffect, useRef, useCallback } from "react";
import type { Block } from "viem";
import { useEthereum } from "./useEthereum";
import { useConfigStore } from "@/stores/configStore";
import type { NodeStatus } from "@/types/ethereum";

const POLL_MS = 3000;
const BLOCK_COUNT = 10;

export interface DashboardLiveState {
  latestBlockNumber: bigint | null;
  blocks: Block[];
  status: NodeStatus | null;
  error: string | null;
  loading: boolean;
  lastUpdated: number | null;
}

const emptyState: DashboardLiveState = {
  latestBlockNumber: null,
  blocks: [],
  status: null,
  error: null,
  loading: true,
  lastUpdated: null,
};

export function useDashboardLive(): DashboardLiveState {
  const eth = useEthereum();
  const rpcUrl = useConfigStore((s) => s.rpcUrl);
  const [state, setState] = useState<DashboardLiveState>(emptyState);
  const mounted = useRef(true);

  const tick = useCallback(async () => {
    if (!eth) return;
    setState((prev) => ({
      ...prev,
      loading: prev.blocks.length === 0 && !prev.error,
    }));
    try {
      const [latest, chainId, syncStatus, clientVersion, peerCount] =
        await Promise.all([
          eth.getLatestBlockNumber(),
          eth.getChainId().catch(() => null),
          eth.getSyncStatus().catch(() => null),
          eth.getClientVersion().catch(() => null),
          eth.getPeerCount().catch(() => null),
        ]);

      const blockPromises: Promise<Block>[] = [];
      for (let i = 0; i < BLOCK_COUNT; i++) {
        const n = latest - BigInt(i);
        if (n >= 0n) blockPromises.push(eth.getBlock(n));
      }
      const blocks = await Promise.all(blockPromises);

      const status: NodeStatus = {
        isConnected: chainId !== null,
        chainId,
        clientVersion,
        peerCount,
        syncStatus,
        latestBlockNumber: latest,
      };

      if (mounted.current) {
        setState({
          latestBlockNumber: latest,
          blocks,
          status,
          error: null,
          loading: false,
          lastUpdated: Date.now(),
        });
      }
    } catch (err) {
      if (mounted.current) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Failed to fetch chain data",
          loading: false,
        }));
      }
    }
  }, [eth]);

  useEffect(() => {
    mounted.current = true;
    if (!eth || !rpcUrl) {
      setState({
        ...emptyState,
        loading: false,
        error: null,
      });
      return;
    }
    setState({ ...emptyState, loading: true });
    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [eth, rpcUrl, tick]);

  return state;
}
