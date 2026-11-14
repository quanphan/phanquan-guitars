import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolveDevelopmentApiTarget } from "./src/config/apiMode.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = resolveDevelopmentApiTarget(env);
  const proxy = {
    "/api": {
      target: apiTarget,
      changeOrigin: true,
      configure(proxyServer) {
        proxyServer.on("error", (error, _req, res) => {
          console.error(`[vite] API proxy error → ${apiTarget}: ${error.message}`);
          if (res && !res.headersSent) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "api_proxy_unavailable", target: apiTarget }));
          }
        });
      },
    },
    "/uploads": {
      target: apiTarget,
      changeOrigin: true,
    },
  };

  if (mode === "development") {
    console.info(`[vite] API proxy → ${apiTarget} (VITE_API_MODE=${env.VITE_API_MODE || "unset"})`);
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "::",
      port: 5173,
      strictPort: true,
      proxy,
    },
    preview: {
      host: "::",
      port: 4173,
      strictPort: true,
      proxy,
    },
    assetsInclude: ["**/*.glb", "**/*.gltf"],
    optimizeDeps: {
      include: ["three", "@react-three/fiber", "@react-three/drei"],
    },
  };
});
