import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConfigState {
  rpcUrl: string;
  dialogOpen: boolean;
  use4byte: boolean;
  setRpcUrl: (url: string) => void;
  setDialogOpen: (open: boolean) => void;
  setUse4byte: (enabled: boolean) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      rpcUrl: "",
      dialogOpen: false,
      use4byte: true,
      setRpcUrl: (url) => set({ rpcUrl: url }),
      setDialogOpen: (open) => set({ dialogOpen: open }),
      setUse4byte: (enabled) => set({ use4byte: enabled }),
    }),
    {
      name: "eth-explorer-config",
      partialize: (state) => ({ rpcUrl: state.rpcUrl, use4byte: state.use4byte }),
    },
  ),
);
