import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfigStore } from "@/stores/configStore";
import { EthereumService } from "@/services/EthereumService";

type TestResult = { status: "idle" } | { status: "testing" } | { status: "success"; chainId: number } | { status: "error"; message: string };

export function ConfigureRpcDialog() {
  const { rpcUrl, dialogOpen, setRpcUrl, setDialogOpen } = useConfigStore();
  const [draft, setDraft] = useState(rpcUrl);
  const [testResult, setTestResult] = useState<TestResult>({ status: "idle" });

  const handleOpen = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      setDraft(rpcUrl);
      setTestResult({ status: "idle" });
    }
  };

  const handleTest = async () => {
    if (!draft.trim()) return;
    setTestResult({ status: "testing" });
    const svc = new EthereumService(draft.trim());
    const result = await svc.testConnection();
    if (result.success && result.chainId !== undefined) {
      setTestResult({ status: "success", chainId: result.chainId });
    } else {
      setTestResult({ status: "error", message: result.error ?? "Unknown error" });
    }
  };

  const handleSave = () => {
    setRpcUrl(draft.trim());
    setDialogOpen(false);
  };

  const handleDisconnect = () => {
    setRpcUrl("");
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure RPC Endpoint</DialogTitle>
          <DialogDescription>
            Enter the URL of your Ethereum JSON-RPC node.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rpc-url">RPC URL</Label>
            <Input
              id="rpc-url"
              placeholder="http://localhost:8545"
              value={draft}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setDraft(e.target.value);
                setTestResult({ status: "idle" });
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") void handleTest();
              }}
            />
          </div>

          {testResult.status === "testing" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing connection...
            </div>
          )}
          {testResult.status === "success" && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Connected! Chain ID: {testResult.chainId}
            </div>
          )}
          {testResult.status === "error" && (
            <div className="flex items-start gap-3 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1 text-left">
                <p className="font-medium leading-none">Connection Failed</p>
                <p className="text-destructive/90">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 w-full sm:justify-between">
          <div>
            {rpcUrl ? (
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDisconnect}>
                Disconnect
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:space-x-2 sm:gap-0">
            <Button variant="outline" onClick={handleTest} disabled={!draft.trim() || testResult.status === "testing"}>
              Test Connection
            </Button>
            <Button onClick={handleSave} disabled={!draft.trim()}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
