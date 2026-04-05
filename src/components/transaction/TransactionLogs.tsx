import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { Log } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailRow } from "@/components/common/DetailRow";
import { resolveEvent } from "@/lib/knownEvents";
import type { ResolvedParam } from "@/lib/knownEvents";
import { useFourByteSignature } from "@/hooks/useFourByteSignature";

type TransactionLogsProps = {
  logs: Log[];
  contractNames?: Record<string, string>;
  use4byte: boolean;
};

function ParamRow({ param }: { param: ResolvedParam }) {
  if (param.type === "address") {
    return (
      <DetailRow
        label={param.name}
        value={
          <Link
            to={`/account/${param.value}`}
            className="break-all font-mono text-blue-500 hover:underline"
          >
            {param.value}
          </Link>
        }
        copyable={param.value}
      />
    );
  }
  return (
    <DetailRow
      label={param.name}
      value={param.value}
      copyable={param.value}
      mono={param.type !== "bool"}
    />
  );
}

type EventNameRowProps = {
  resolved: { name: string } | null;
  topic0: string | undefined;
  use4byte: boolean;
};

function EventNameRow({ resolved, topic0, use4byte }: EventNameRowProps) {
  const { name: fourByteName, loading } = useFourByteSignature(
    resolved ? undefined : topic0,
    !resolved && use4byte,
  );

  if (resolved) {
    return (
      <DetailRow
        label="Event"
        value={<Badge variant="outline">{resolved.name}</Badge>}
      />
    );
  }

  if (loading) {
    return (
      <DetailRow
        label="Event"
        value={<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      />
    );
  }

  if (fourByteName) {
    return (
      <DetailRow
        label="Event"
        value={<Badge variant="outline">{fourByteName}</Badge>}
      />
    );
  }

  return (
    <DetailRow
      label="Event"
      value={<span className="text-muted-foreground">Other</span>}
    />
  );
}

type LogCardProps = {
  log: Log;
  index: number;
  contractNames?: Record<string, string>;
  use4byte: boolean;
};

function LogCard({ log, index, contractNames, use4byte }: LogCardProps) {
  const resolved = resolveEvent(log.topics, log.data as `0x${string}`);
  const badgeLabel = log.logIndex?.toString() ?? String(index);
  const topic0 = log.topics[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Event <Badge variant="secondary">#{badgeLabel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          <EventNameRow resolved={resolved} topic0={topic0} use4byte={use4byte} />
          <DetailRow
            label={resolved ? "Contract" : "Address"}
            value={
              <div className="flex flex-col gap-1">
                <Link
                  to={`/account/${log.address}`}
                  className="break-all font-mono text-blue-500 hover:underline"
                >
                  {log.address}
                </Link>
                {contractNames?.[log.address] && (
                  <span className="text-xs text-muted-foreground">{contractNames[log.address]}</span>
                )}
              </div>
            }
            copyable={log.address}
          />
          {resolved ? (
            resolved.params.map((param) => <ParamRow key={param.name} param={param} />)
          ) : (
            <>
              {log.topics.map((topic, ti) => (
                <DetailRow
                  key={ti}
                  label={ti === 0 ? "Event Sig" : `Topic ${ti}`}
                  value={topic}
                  copyable={topic}
                  mono
                />
              ))}
              {log.data && log.data !== "0x" && (
                <DetailRow label="Data" value={log.data} copyable={log.data} mono />
              )}
            </>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

export function TransactionLogs({ logs, contractNames, use4byte }: TransactionLogsProps) {
  if (logs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No logs emitted by this transaction.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {logs.map((log, i) => (
        <LogCard key={i} log={log} index={i} contractNames={contractNames} use4byte={use4byte} />
      ))}
    </div>
  );
}
