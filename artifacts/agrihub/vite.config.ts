import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT || "5173";
const port = Number(rawPort);

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [tailwindcss()],
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
        community: path.resolve(import.meta.dirname, "community.html"),
        "land-market": path.resolve(import.meta.dirname, "land-market.html"),
        profile: path.resolve(import.meta.dirname, "profile.html"),
        home: path.resolve(import.meta.dirname, "home.html"),
        learning: path.resolve(import.meta.dirname, "learning.html"),
        "smart-home": path.resolve(import.meta.dirname, "smart-home.html"),
        prosurvey: path.resolve(import.meta.dirname, "prosurvey.html"),
        payment: path.resolve(import.meta.dirname, "payment.html"),
        "admin/dashboard": path.resolve(import.meta.dirname, "admin/dashboard.html"),
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: false },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
