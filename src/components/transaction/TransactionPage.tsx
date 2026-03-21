import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { Transaction, TransactionReceipt } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEthereum } from "@/hooks/useEthereum";
import { DetailRow } from "@/components/common/DetailRow";
import { formatEth, formatGas } from "@/lib/format";

export function TransactionPage() {
  const { txHash } = useParams<{ txHash: string }>();
  const navigate = useNavigate();
  const eth = useEthereum();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [latestBlock, setLatestBlock] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTx = useCallback(async () => {
    if (!eth || !txHash) return;
    setLoading(true);
    setError(null);
    try {
      const hash = txHash as `0x${string}`;
      const [t, r, latest] = await Promise.all([
        eth.getTransaction(hash),
        eth.getTransactionReceipt(hash).catch(() => null),
        eth.getLatestBlockNumber(),
      ]);
      setTx(t);
      setReceipt(r);
      setLatestBlock(latest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transaction");
    } finally {
      setLoading(false);
    }
  }, [eth, txHash]);

  useEffect(() => {
    void fetchTx();
  }, [fetchTx]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-destructive">Transaction Not Found</h2>
        <p className="mt-2 text-muted-foreground">{error ?? "Transaction does not exist"}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const confirmations =
    tx.blockNumber !== null && tx.blockNumber !== undefined && latestBlock !== null
      ? latestBlock - tx.blockNumber
      : null;

  const statusBadge = receipt ? (
    receipt.status === "success" ? (
      <Badge variant="default" className="bg-green-600">Success</Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    )
  ) : (
    <Badge variant="secondary">Pending</Badge>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold">Transaction Details</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Transaction {statusBadge}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <DetailRow label="Hash" value={tx.hash} copyable={tx.hash} mono />
            <DetailRow
              label="Status"
              value={statusBadge}
            />
            <DetailRow
              label="Block"
              value={
                tx.blockNumber !== null && tx.blockNumber !== undefined ? (
                  <Link to={`/block/${tx.blockNumber}`} className="text-blue-500 hover:underline font-mono">
                    #{tx.blockNumber.toLocaleString()}
                  </Link>
                ) : (
                  "Pending"
                )
              }
            />
            {confirmations !== null && (
              <DetailRow label="Confirmations" value={confirmations.toLocaleString()} />
            )}
            <DetailRow
              label="From"
              value={
                <Link to={`/account/${tx.from}`} className="text-blue-500 hover:underline font-mono break-all">
                  {tx.from}
                </Link>
              }
              copyable={tx.from}
            />
            <DetailRow
              label="To"
              value={
                tx.to ? (
                  <Link to={`/account/${tx.to}`} className="text-blue-500 hover:underline font-mono break-all">
                    {tx.to}
                  </Link>
                ) : (
                  <Badge variant="secondary">Contract Creation</Badge>
                )
              }
              copyable={tx.to ?? undefined}
            />
            <DetailRow label="Value" value={formatEth(tx.value)} />
            <DetailRow label="Gas Limit" value={formatGas(tx.gas)} />
            {tx.gasPrice !== undefined && tx.gasPrice !== null && (
              <DetailRow label="Gas Price" value={`${tx.gasPrice.toLocaleString()} wei`} />
            )}
            {receipt && (
              <DetailRow label="Gas Used" value={formatGas(receipt.gasUsed)} />
            )}
            {receipt && (
              <DetailRow
                label="Transaction Fee"
                value={formatEth(receipt.gasUsed * (receipt.effectiveGasPrice ?? 0n))}
              />
            )}
            <DetailRow label="Nonce" value={tx.nonce.toString()} />
            <DetailRow label="Transaction Index" value={tx.transactionIndex?.toString() ?? "—"} />
            {tx.input && tx.input !== "0x" && (
              <DetailRow
                label="Input Data"
                value={
                  <span className="max-h-32 overflow-auto block">
                    {tx.input.length > 200 ? `${tx.input.slice(0, 200)}...` : tx.input}
                  </span>
                }
                mono
                copyable={tx.input}
              />
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
