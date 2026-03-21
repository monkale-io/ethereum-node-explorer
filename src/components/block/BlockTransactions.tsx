import { Link } from "react-router-dom";
import { truncateHash } from "@/lib/format";

interface BlockTransactionsProps {
  transactions: string[];
}

export function BlockTransactions({ transactions }: BlockTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No transactions in this block.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((txHash, idx) => (
        <Link
          key={txHash}
          to={`/tx/${txHash}`}
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
        >
          <span className="text-muted-foreground">{idx}</span>
          <span className="font-mono">{truncateHash(txHash, 10, 8)}</span>
        </Link>
      ))}
    </div>
  );
}
