import { useState, useEffect } from "react";
import { lookupEventSignature } from "@/lib/fourByte";

type Resolved = { topic: string; name: string | null };

export function useFourByteSignature(
  topicHash: string | undefined,
  auto: boolean,
): { name: string | null; loading: boolean } {
  const [data, setData] = useState<Resolved | null>(null);

  useEffect(() => {
    if (!auto || !topicHash) return;
    const hash = topicHash;
    let cancelled = false;
    lookupEventSignature(hash).then((name) => {
      if (!cancelled) setData({ topic: hash, name });
    });
    return () => {
      cancelled = true;
    };
  }, [auto, topicHash]);

  const name = data !== null && data.topic === topicHash ? data.name : null;
  const loading = auto && !!topicHash && data?.topic !== topicHash && !name;

  return { name, loading };
}
