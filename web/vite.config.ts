import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api to the Express backend so the web app can use same-origin calls.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
