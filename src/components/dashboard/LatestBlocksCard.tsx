import { Link } from "react-router-dom";
import { Blocks } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Block } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo, truncateHash } from "@/lib/format";

export interface LatestBlocksCardProps {
  blocks: Block[];
  loading: boolean;
  error: string | null;
}

export function LatestBlocksCard({ blocks, loading, error }: LatestBlocksCardProps) {
  const reduceMotion = useReducedMotion();

  if (error) {
    return (
      <Card className="card-elevated motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Blocks className="h-5 w-5" />
            Latest Blocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (loading && blocks.length === 0) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Blocks className="h-5 w-5" />
            Latest Blocks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Blocks className="h-5 w-5" />
          Latest Blocks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {blocks.map((block, i) => (
            <motion.div
              key={block.number?.toString() ?? String(i)}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 0.2, delay: Math.min(i, 8) * 0.04 }
              }
            >
              <Link
                to={`/block/${block.number}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm motion-safe:transition-transform motion-safe:duration-150 motion-safe:hover:-translate-y-px motion-safe:hover:shadow-sm hover:bg-accent/80"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono font-medium">
                    #{block.number?.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {truncateHash(block.hash ?? "")}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    {block.transactions.length} txs
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {block.timestamp ? timeAgo(block.timestamp) : ""}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
