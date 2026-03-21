import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { Block } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEthereum } from "@/hooks/useEthereum";
import { DetailRow } from "@/components/common/DetailRow";
import { BlockTransactions } from "./BlockTransactions";
import { formatTimestamp, formatGas, timeAgo } from "@/lib/format";

export function BlockPage() {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const eth = useEthereum();
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestBlock, setLatestBlock] = useState<bigint | null>(null);

  const fetchBlock = useCallback(async () => {
    if (!eth || !blockId) return;
    setLoading(true);
    setError(null);
    try {
      const identifier = /^0x/.test(blockId)
        ? (blockId as `0x${string}`)
        : BigInt(blockId);
      const [b, latest] = await Promise.all([
        eth.getBlock(identifier),
        eth.getLatestBlockNumber(),
      ]);
      setBlock(b);
      setLatestBlock(latest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch block");
    } finally {
      setLoading(false);
    }
  }, [eth, blockId]);

  useEffect(() => {
    void fetchBlock();
  }, [fetchBlock]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-destructive">Block Not Found</h2>
        <p className="mt-2 text-muted-foreground">{error ?? "Block does not exist"}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const blockNum = block.number ?? 0n;
  const confirmations = latestBlock !== null ? latestBlock - blockNum : null;
  const txHashes = block.transactions as string[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={blockNum <= 0n}
          onClick={() => navigate(`/block/${blockNum - 1n}`)}
          aria-label="Previous block"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="px-3 py-1 font-mono text-base font-semibold">
            #{blockNum.toLocaleString()}
          </Badge>
          {confirmations !== null && (
            <Badge variant="secondary">{confirmations.toLocaleString()} confirmations</Badge>
          )}
          {block.timestamp ? (
            <Badge variant="outline">{timeAgo(block.timestamp)}</Badge>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="icon"
          disabled={latestBlock !== null && blockNum >= latestBlock}
          onClick={() => navigate(`/block/${blockNum + 1n}`)}
          aria-label="Next block"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {txHashes.length > 0 ? (
          <button
            type="button"
            className="ml-auto text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={() =>
              document
                .getElementById("block-transactions")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            Jump to transactions
          </button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Block Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <DetailRow label="Block Number" value={blockNum.toLocaleString()} />
              {confirmations !== null && (
                <DetailRow label="Confirmations" value={confirmations.toLocaleString()} />
              )}
              <DetailRow label="Hash" value={block.hash ?? "—"} copyable={block.hash ?? undefined} mono />
              <DetailRow label="Parent Hash" value={
                <Link to={`/block/${blockNum - 1n}`} className="text-blue-500 hover:underline font-mono break-all">
                  {block.parentHash}
                </Link>
              } copyable={block.parentHash} />
              <DetailRow label="Timestamp" value={block.timestamp ? `${formatTimestamp(block.timestamp)} (${timeAgo(block.timestamp)})` : "—"} />
              <DetailRow label="Miner" value={
                <Link to={`/account/${block.miner}`} className="text-blue-500 hover:underline font-mono break-all">
                  {block.miner}
                </Link>
              } copyable={block.miner ?? undefined} />
              <DetailRow label="Gas Used" value={block.gasUsed !== undefined ? `${formatGas(block.gasUsed)} / ${formatGas(block.gasLimit)}` : "—"} />
              {block.baseFeePerGas !== undefined && block.baseFeePerGas !== null && (
                <DetailRow label="Base Fee" value={`${block.baseFeePerGas.toLocaleString()} wei`} />
              )}
              <DetailRow label="Difficulty" value={block.difficulty?.toLocaleString() ?? "—"} />
              <DetailRow label="Size" value={block.size !== undefined ? `${block.size.toLocaleString()} bytes` : "—"} />
              <DetailRow label="Nonce" value={block.nonce ?? "—"} mono />
              <DetailRow label="Transactions" value={`${txHashes.length} transaction${txHashes.length !== 1 ? "s" : ""}`} />
              {block.extraData && block.extraData !== "0x" && (
                <DetailRow label="Extra Data" value={block.extraData} mono />
              )}
            </dl>
          </CardContent>
        </Card>

        <Card id="block-transactions" className="card-elevated scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-base">
              Transactions ({txHashes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BlockTransactions transactions={txHashes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
