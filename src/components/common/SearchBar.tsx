import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { detectSearchInput } from "@/lib/format";

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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const type = detectSearchInput(trimmed);
    switch (type) {
      case "block":
        navigate(`/block/${trimmed}`);
        break;
      case "transaction":
        navigate(`/tx/${trimmed}`);
        break;
      case "address":
        navigate(`/account/${trimmed}`);
        break;
      default:
        if (/^\d+$/.test(trimmed)) {
          navigate(`/block/${trimmed}`);
        }
        break;
    }
    setQuery("");
  };

  const isLarge = resolvedVariant === "large";
  const isHeader = resolvedVariant === "header";

  const placeholder = isHeader
    ? "Block, tx hash, or address…"
    : "Search by block number, tx hash, or address... (press /)";

  return (
    <div
      className={`flex gap-2 ${isHeader ? "max-w-xl md:max-w-2xl lg:max-w-3xl" : ""} ${className}`}
    >
      <div className="relative min-w-0 flex-1">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${isLarge ? "h-5 w-5" : "h-4 w-4"}`}
        />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") handleSearch();
          }}
          className={`shadow-sm ${isLarge ? "h-12 pl-10 text-base" : "h-9 pl-9 text-sm"} ${isHeader ? "rounded-full border-muted-foreground/20 bg-card/80" : ""}`}
        />
      </div>
      <Button
        onClick={handleSearch}
        disabled={!query.trim()}
        className={`shrink-0 ${isLarge ? "h-12 px-6" : ""} ${isHeader ? "rounded-full px-4" : ""}`}
      >
        Search
      </Button>
    </div>
  );
}
