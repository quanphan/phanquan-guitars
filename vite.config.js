import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiTarget = process.env.VITE_API_BASE_URL || "http://127.0.0.1:5050";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "::",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/uploads": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "::",
    port: 4173,
    strictPort: true,
  },
});
