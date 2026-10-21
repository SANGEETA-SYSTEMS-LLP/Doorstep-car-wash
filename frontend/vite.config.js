import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), tailwindcss()],
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
