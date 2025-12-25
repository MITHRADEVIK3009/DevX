import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import Sidebar from "./ui/Sidebar";
import { ContextMap } from "../types";

/**
 * Webview entry point
 * Handles message passing between extension and React UI
 */
function App() {
  const [contextMap, setContextMap] = useState<ContextMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const vscodeApi = (window as any).acquireVsCodeApi?.();

    // Listen for messages from extension
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "update-context":
          setIsLoading(false);
          setContextMap(message.payload as ContextMap);
          break;

        case "loading":
          setIsLoading(true);
          break;

        case "clear":
          setContextMap(null);
          setIsLoading(false);
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", messageHandler);

    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  return <Sidebar contextMap={contextMap} isLoading={isLoading} />;
}

// Mount React app
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
