import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite configuration with React plugin and default dev server port.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
