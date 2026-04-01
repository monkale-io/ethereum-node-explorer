import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  createElement,
} from "react";
import { EthereumService } from "@/services/EthereumService";
import { useConfigStore } from "@/stores/configStore";

const EthereumContext = createContext<EthereumService | null>(null);

export function EthereumProvider({ children }: { children: ReactNode }) {
  const rpcUrl = useConfigStore((s) => s.rpcUrl);
  
  const service = useMemo(() => {
    return rpcUrl ? new EthereumService(rpcUrl) : null;
  }, [rpcUrl]);

  return createElement(
    EthereumContext.Provider,
    { value: service },
    children,
  );
}

export function useEthereum(): EthereumService | null {
  return useContext(EthereumContext);
}
