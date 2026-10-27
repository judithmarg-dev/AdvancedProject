import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { DEFAULT_CLIENT_PORT } from "../shared/types.ts";

export default defineConfig({
  plugins: [react()],
  envDir: "..",
  server: { port: DEFAULT_CLIENT_PORT, strictPort: true },
});
