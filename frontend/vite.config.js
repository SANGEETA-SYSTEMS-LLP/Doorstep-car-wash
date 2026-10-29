import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(process.cwd(), "index.html"),
          terms: resolve(process.cwd(), "terms.html"),
          privacy: resolve(process.cwd(), "privacy.html"),
        },
      },
    },
    server: {
      proxy: env.VITE_SUPABASE_URL ? {
        "/supabase-auth": {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/supabase-auth/, "/auth/v1"),
        },
      } : {},
    },
  };
});
