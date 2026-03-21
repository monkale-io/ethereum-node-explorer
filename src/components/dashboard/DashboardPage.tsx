import { useConfigStore } from "@/stores/configStore";
import { Button } from "@/components/ui/button";
import { Settings, AlertCircle } from "lucide-react";
import { useDashboardLive } from "@/hooks/useDashboardLive";
import { NodeStatusCard } from "./NodeStatusCard";
import { LatestBlocksCard } from "./LatestBlocksCard";
import { BlocksTxChart } from "./BlocksTxChart";

export function DashboardPage() {
  const { rpcUrl, setDialogOpen } = useConfigStore();
  const live = useDashboardLive();

  if (!rpcUrl) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-8 px-4 py-24 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Connect Your Node
          </h1>
          <p className="text-lg text-muted-foreground">
            Add your JSON-RPC endpoint to explore blocks, transactions, and accounts
            on your Ethereum-compatible chain.
          </p>
        </div>
        <Button size="lg" className="h-12 px-8 text-base shadow-lg transition-all hover:scale-105" onClick={() => setDialogOpen(true)}>
          <Settings className="mr-2 h-5 w-5" />
          Configure RPC Endpoint
        </Button>
      </div>
    );
  }

  if (live.error && live.blocks.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-8 px-4 py-24 text-center">
        <div className="rounded-full bg-destructive/10 p-6">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Connection Failed
          </h1>
          <p className="text-lg text-muted-foreground break-all">
            {live.error}
          </p>
        </div>
        <Button size="lg" className="h-12 px-8 text-base shadow-lg transition-all hover:scale-105" onClick={() => setDialogOpen(true)}>
          <Settings className="mr-2 h-5 w-5" />
          Reconfigure RPC Endpoint
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <BlocksTxChart blocks={live.blocks} />
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <NodeStatusCard
          status={live.status}
          loading={live.loading}
          error={live.error}
          lastUpdated={live.lastUpdated}
        />
        <LatestBlocksCard
          blocks={live.blocks}
          loading={live.loading}
          error={live.error}
        />
      </div>
    </div>
  );
}
