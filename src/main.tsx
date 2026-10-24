import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { ThemeProvider } from "./components/ThemeProvider";
import { registerServiceWorker } from "./lib/registerSW";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <App />
  </ThemeProvider>
);

registerServiceWorker();
