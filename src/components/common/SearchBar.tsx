import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { detectSearchInput } from "@/lib/format";
import { useEthereum } from "@/hooks/useEthereum";

interface SearchBarProps {
  className?: string;
  /** @deprecated use variant */
  size?: "default" | "large";
  variant?: "default" | "large" | "header";
}

export function SearchBar({
  className = "",
  size = "default",
  variant,
}: SearchBarProps) {
  const resolvedVariant = variant ?? (size === "large" ? "large" : "default");
  const [query, setQuery] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [ensError, setEnsError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ethereum = useEthereum();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  const navigate = useNavigate();

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const type = detectSearchInput(trimmed);
    switch (type) {
      case "block":
        navigate(`/block/${trimmed}`);
        setQuery("");
        break;
      case "transaction":
        navigate(`/tx/${trimmed}`);
        setQuery("");
        break;
      case "address":
        navigate(`/account/${trimmed}`);
        setQuery("");
        break;
      case "ens":
        if (!ethereum) {
          setEnsError("Network connection required for ENS");
          return;
        }
        setIsResolving(true);
        setEnsError(null);
        try {
          const address = await ethereum.resolveEnsName(trimmed);
          if (address) {
            navigate(`/account/${address}`);
            setQuery("");
          } else {
            setEnsError("ENS name not found");
          }
        } catch {
          setEnsError("Failed to resolve ENS name");
        } finally {
          setIsResolving(false);
        }
        break;
      default:
        if (/^\d+$/.test(trimmed)) {
          navigate(`/block/${trimmed}`);
          setQuery("");
        }
        break;
    }
  };

  const isLarge = resolvedVariant === "large";
  const isHeader = resolvedVariant === "header";

  const placeholder = isHeader
    ? "Block, tx hash, address, or ENS name…"
    : "Search by block number, tx hash, address, or ENS name... (press /)";

  return (
    <div
      className={`flex flex-col gap-2 ${isHeader ? "max-w-xl md:max-w-2xl lg:max-w-3xl" : ""} ${className}`}
    >
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${isLarge ? "h-5 w-5" : "h-4 w-4"}`}
          />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQuery(e.target.value);
              setEnsError(null);
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") handleSearch();
            }}
            className={`shadow-sm ${isLarge ? "h-12 pl-10 text-base" : "h-9 pl-9 text-sm"} ${isHeader ? "rounded-full border-muted-foreground/20 bg-card/80" : ""}`}
            disabled={isResolving}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isResolving}
          className={`shrink-0 ${isLarge ? "h-12 px-6" : ""} ${isHeader ? "rounded-full px-4" : ""}`}
        >
          {isResolving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resolving...
            </>
          ) : (
            "Search"
          )}
        </Button>
      </div>
      {ensError && (
        <p className="text-sm font-medium text-destructive px-3">{ensError}</p>
      )}
    </div>
  );
}
