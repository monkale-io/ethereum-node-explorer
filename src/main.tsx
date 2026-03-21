import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/globals.css";
import logoDataUrl from "@/assets/logo.png?inline";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const favicon =
  document.querySelector<HTMLLinkElement>("link[rel='icon']") ??
  document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/png";
favicon.href = logoDataUrl;
if (!favicon.parentNode) {
  document.head.appendChild(favicon);
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
