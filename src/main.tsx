import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "./contexts/LanguageContext";
import { registerServiceWorker, setupInstallPrompt } from "./utils/pwa";
import App from "./App.tsx";
import "./index.css";

// Register PWA service worker and install prompt
registerServiceWorker();
setupInstallPrompt();

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>
);
