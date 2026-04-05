const cache = new Map<string, string | null>();

// in-flight promises keyed by hex sig to avoid duplicate concurrent fetches
const inflight = new Map<string, Promise<string | null>>();

export async function lookupEventSignature(hexSig: string): Promise<string | null> {
  if (cache.has(hexSig)) return cache.get(hexSig)!;

  if (inflight.has(hexSig)) return inflight.get(hexSig)!;

  const request = (async () => {
    try {
      const res = await fetch(
        `https://www.4byte.directory/api/v1/event-signatures/?hex_signature=${hexSig}`,
      );
      if (!res.ok) {
        cache.set(hexSig, null);
        return null;
      }
      const json = (await res.json()) as { results: { text_signature: string }[] };
      const first = json.results[0];
      const name: string | null = first
        ? (first.text_signature.split("(")[0] ?? null)
        : null;
      cache.set(hexSig, name);
      return name;
    } catch {
      cache.set(hexSig, null);
      return null;
    } finally {
      inflight.delete(hexSig);
    }
  })();

  inflight.set(hexSig, request);
  return request;
}

export function clearFourByteCache(): void {
  cache.clear();
  inflight.clear();
}
