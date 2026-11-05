import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

// La conexión ya no se abre al cargar: la inicia la pantalla de entrada (spec 003).
createRoot(document.getElementById("root")!).render(<App />);
