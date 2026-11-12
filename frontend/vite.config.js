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
      proxy: {
        "/api": {
          target: new URL(env.VITE_API_URL || "http://127.0.0.1:5000/api", "http://127.0.0.1:5000").origin,
          changeOrigin: true,
          // Payment order creation makes sequential Supabase and Razorpay
          // requests. Keep the dev proxy alive for the backend's 120s request
          // window instead of dropping a slow checkout as a proxy 502.
          timeout: 120000,
          proxyTimeout: 120000,
        },
        ...(env.VITE_SUPABASE_URL ? {
          "/supabase-auth": {
            target: env.VITE_SUPABASE_URL,
            changeOrigin: true,
            rewrite: path => path.replace(/^\/supabase-auth/, "/auth/v1"),
            timeout: 30000,
            proxyTimeout: 30000,
          },
        } : {}),
      },
    },
  };
});
