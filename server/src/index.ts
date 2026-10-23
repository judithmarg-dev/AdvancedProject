import { getPort, loadEnv } from "./config";
import { startServer } from "./server";

loadEnv();

startServer(getPort()).catch((err) => {
  console.error("[Servidor] No se pudo iniciar:", err);
  process.exit(1);
});
