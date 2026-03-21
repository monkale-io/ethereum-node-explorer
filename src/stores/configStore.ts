import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConfigState {
  rpcUrl: string;
  dialogOpen: boolean;
  setRpcUrl: (url: string) => void;
  setDialogOpen: (open: boolean) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      rpcUrl: "",
      dialogOpen: false,
      setRpcUrl: (url) => set({ rpcUrl: url }),
      setDialogOpen: (open) => set({ dialogOpen: open }),
    }),
    {
      name: "eth-explorer-config",
      partialize: (state) => ({ rpcUrl: state.rpcUrl }),
    },
  ),
);
