import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./hooks/use-theme";

// Apply theme before render to prevent flash
initTheme();

createRoot(document.getElementById("root")!).render(<App />);
