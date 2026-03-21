import { Github, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SearchBar } from "@/components/common/SearchBar";
import { useConfigStore } from "@/stores/configStore";
import logoDataUrl from "@/assets/logo.png?inline";

export function Header() {
  const { rpcUrl, setDialogOpen } = useConfigStore();
  const isConnected = !!rpcUrl;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-start">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <img src={logoDataUrl} alt="Monkale Logo" className="h-10 w-auto object-contain" />
            <span className="hidden text-base sm:inline sm:max-w-[200px] sm:truncate md:max-w-none">
              Monkale Ethereum Node Explorer
            </span>
            <span className="text-base sm:hidden">Monkale</span>
          </Link>
          <div className="flex items-center gap-1 sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Configure RPC endpoint"
              onClick={() => setDialogOpen(true)}
            >
              <Settings className="h-5 w-5" />
              <span
                className={`pointer-events-none absolute right-1 top-1 h-2 w-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild aria-label="GitHub">
              <a href="https://github.com/monkale-io/ethereum-node-explorer" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>

        {rpcUrl ? (
          <div className="min-w-0 flex-1 sm:px-2">
            <SearchBar variant="header" className="w-full" />
          </div>
        ) : null}

        <div className="hidden items-center gap-1 sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Configure RPC endpoint"
            onClick={() => setDialogOpen(true)}
          >
            <Settings className="h-5 w-5" />
            <span
              className={`pointer-events-none absolute right-1 top-1 h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild aria-label="View source on GitHub">
            <a href="https://github.com/monkale-io/ethereum-node-explorer" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
