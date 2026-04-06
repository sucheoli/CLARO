import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "src/renderer",
  plugins: [react()],
  base: "./",
  build: {
    outDir: path.resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        overlay: path.resolve(__dirname, "src/renderer/overlay/index.html"),
        dashboard: path.resolve(__dirname, "src/renderer/dashboard/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@core": path.resolve(__dirname, "src/core"),
    },
  },
  server: {
    port: 5173,
  },
});
