import { createRoot } from "react-dom/client";
import { DEFAULT_SERVER_PORT } from "@office/shared";
import { App } from "./App";
import { connectToServer } from "./net/connect";

// Una sola conexión por carga de página (fuera de React para no duplicarla).
void connectToServer(import.meta.env.VITE_SERVER_URL ?? `ws://localhost:${DEFAULT_SERVER_PORT}`);

createRoot(document.getElementById("root")!).render(<App />);
