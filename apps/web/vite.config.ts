import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  server: {
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSpliting: true,
    }),
    tailwindcss(),
    react(),
  ],
});
