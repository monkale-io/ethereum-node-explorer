import {
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
  createElement,
} from "react";
import { EthereumService } from "@/services/EthereumService";
import { useConfigStore } from "@/stores/configStore";

const EthereumContext = createContext<EthereumService | null>(null);

export function EthereumProvider({ children }: { children: ReactNode }) {
  const rpcUrl = useConfigStore((s) => s.rpcUrl);
  const serviceRef = useRef<EthereumService | null>(null);

  if (!serviceRef.current && rpcUrl) {
    serviceRef.current = new EthereumService(rpcUrl);
  }

  useEffect(() => {
    if (!rpcUrl) {
      serviceRef.current = null;
      return;
    }
    if (serviceRef.current) {
      serviceRef.current.reconfigure(rpcUrl);
    } else {
      serviceRef.current = new EthereumService(rpcUrl);
    }
  }, [rpcUrl]);

  return createElement(
    EthereumContext.Provider,
    { value: serviceRef.current },
    children,
  );
}

export function useEthereum(): EthereumService | null {
  return useContext(EthereumContext);
}
