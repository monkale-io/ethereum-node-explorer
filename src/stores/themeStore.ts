import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

function applyThemeToDOM(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", mode === "dark");
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => {
        applyThemeToDOM(mode);
        set({ mode });
      },
    }),
    {
      name: "eth-explorer-theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeToDOM(state.mode);
      },
    },
  ),
);

function handleSystemThemeChange() {
  const { mode } = useThemeStore.getState();
  if (mode === "system") applyThemeToDOM("system");
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", handleSystemThemeChange);

applyThemeToDOM(useThemeStore.getState().mode);
