import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { Block } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export interface BlocksTxChartProps {
  blocks: Block[];
}

export function BlocksTxChart({ blocks }: BlocksTxChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  if (blocks.length === 0) return null;

  const counts = blocks.map((b) => b.transactions.length);
  const max = Math.max(...counts, 1);
  const ordered = [...blocks].reverse();

  return (
    <Card className="card-elevated motion-safe:transition-shadow motion-safe:duration-200 motion-safe:hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5" />
          Last blocks — transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-36 justify-between gap-1 px-1"
          role="img"
          aria-label="Transaction count per recent block"
        >
          {ordered.map((block, i) => {
            const count = block.transactions.length;
            const h = Math.max(10, (count / max) * 100);
            const num = block.number ?? 0n;
            const isHover = hovered === i;

            return (
              <div
                key={num.toString()}
                className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col items-center justify-end"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {isHover && (
                  <div
                    className="absolute bottom-full z-10 mb-1 flex min-w-[120px] -translate-x-1/2 left-1/2 flex-col rounded-md border bg-popover px-2 py-1 text-center text-xs shadow-md"
                    role="tooltip"
                  >
                    <span className="font-mono font-semibold text-primary">
                      #{num.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      {count} tx{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <motion.button
                  type="button"
                  aria-label={`Block ${num.toString()}, ${count} transactions`}
                  className="w-full max-w-[28px] origin-bottom rounded-t-sm border border-sky-700/30 bg-sky-500 shadow-sm hover:bg-sky-400 dark:border-sky-400/40 dark:bg-sky-500 dark:hover:bg-sky-400"
                  style={{ height: `${h}%`, minHeight: 6 }}
                  initial={reduceMotion ? undefined : { scaleY: 0.85 }}
                  animate={{ scaleY: 1 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 30 }
                  }
                  whileHover={reduceMotion ? undefined : { scaleY: 1.03 }}
                  onClick={() => navigate(`/block/${num}`)}
                />
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Hover for details — click a bar to open the block
        </p>
      </CardContent>
    </Card>
  );
}
