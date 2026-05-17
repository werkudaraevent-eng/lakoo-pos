import path from "node:path";

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3002",
    },
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React + routing — small but always needed
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Heavy export libs — only loaded on Reports page export action
          "vendor-pdf": ["jspdf", "html2canvas"],
          // xlsx is huge — split so it lazy-loads on demand
          "vendor-xlsx": ["@e965/xlsx"],
          // Icons library — used everywhere but tree-shaken
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
