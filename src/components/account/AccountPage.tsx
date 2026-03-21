import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Loader2, User, FileCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEthereum } from "@/hooks/useEthereum";
import { DetailRow } from "@/components/common/DetailRow";
import { formatEth } from "@/lib/format";

export function AccountPage() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const eth = useEthereum();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    if (!eth || !address) return;
    setLoading(true);
    setError(null);
    try {
      const addr = address as `0x${string}`;
      const [b, c] = await Promise.all([
        eth.getBalance(addr),
        eth.getCode(addr),
      ]);
      setBalance(b);
      setCode(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch account");
    } finally {
      setLoading(false);
    }
  }, [eth, address]);

  useEffect(() => {
    void fetchAccount();
  }, [fetchAccount]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-destructive">Account Error</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isContract = code !== null && code !== "0x" && code.length > 2;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        {isContract ? <FileCode className="h-6 w-6" /> : <User className="h-6 w-6" />}
        Account
        <Badge variant={isContract ? "secondary" : "default"}>
          {isContract ? "Contract" : "EOA"}
        </Badge>
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <DetailRow label="Address" value={address ?? ""} copyable={address} mono />
            <DetailRow label="Balance" value={balance !== null ? formatEth(balance) : "—"} />
            <DetailRow label="Type" value={isContract ? "Contract" : "Externally Owned Account (EOA)"} />
          </dl>
        </CardContent>
      </Card>

      {isContract && code && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Contract Bytecode</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-4 text-xs font-mono break-all whitespace-pre-wrap">
              {code}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
