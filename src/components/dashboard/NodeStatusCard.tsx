import { useState, useEffect } from "react";
import { Activity, Users, Link2, Radio, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { chainName } from "@/lib/format";
import type { NodeStatus } from "@/types/ethereum";
import { cn } from "@/lib/utils";

export interface NodeStatusCardProps {
  status: NodeStatus | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

function useRelativeTime(ts: number | null): string {
  const [label, setLabel] = useState(() => (ts !== null ? relativeTime(ts) : ""));
  useEffect(() => {
    if (ts === null) return;
    const id = setInterval(() => setLabel(relativeTime(ts)), 5000);
    return () => clearInterval(id);
  }, [ts]);
  // keep label in sync when ts changes (new poll tick)
  const current = ts !== null ? relativeTime(ts) : "";
  if (current !== label) setLabel(current);
  return label;
}

export function NodeStatusCard({
  status,
  loading,
  error,
  lastUpdated,
}: NodeStatusCardProps) {
  const updatedLabel = useRelativeTime(lastUpdated);
  if (error) {
    return (
      <Card className="card-elevated motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" />
            Node Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (loading && !status) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" />
            Node Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const syncLabel =
    status.syncStatus === false
      ? "Synced"
      : status.syncStatus
        ? `Syncing ${((Number(status.syncStatus.currentBlock - status.syncStatus.startingBlock) / Math.max(Number(status.syncStatus.highestBlock - status.syncStatus.startingBlock), 1)) * 100).toFixed(1)}%`
        : "Unknown";

  return (
    <Card className="card-elevated motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Activity className="h-5 w-5" />
          Node Status
          <Badge variant={status.isConnected ? "default" : "destructive"} className="ml-auto">
            {status.isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
        {lastUpdated !== null && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Radio
              className={cn("h-3 w-3 text-green-500 motion-safe:animate-pulse")}
              aria-hidden
            />
            <span>Updated {updatedLabel}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4" /> Chain
            </dt>
            <dd className="font-medium">
              {status.chainId !== null ? chainName(status.chainId) : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" /> Sync
            </dt>
            <dd className="font-medium">{syncLabel}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" /> Peers
            </dt>
            <dd className="font-medium">
              {status.peerCount !== null ? status.peerCount : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Latest Block</dt>
            <dd className="font-mono font-medium">
              {status.latestBlockNumber !== null
                ? `#${status.latestBlockNumber.toLocaleString()}`
                : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" /> RPC Latency
            </dt>
            <dd className="font-mono font-medium">
              {status.rpcLatencyMs !== null ? `${status.rpcLatencyMs} ms` : "—"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
