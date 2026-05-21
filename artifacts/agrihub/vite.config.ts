import { defineConfig } from "vite";
<<<<<<< HEAD
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT || "5173";
const port = Number(rawPort);

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [tailwindcss()],
=======
import path from "path";

const rawPort = process.env.PORT;
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

const basePath = process.env.BASE_PATH;
if (!basePath) throw new Error("BASE_PATH environment variable is required but was not provided.");

export default defineConfig({
  base: basePath,
  plugins: [],
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
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
<<<<<<< HEAD
        home: path.resolve(import.meta.dirname, "home.html"),
        learning: path.resolve(import.meta.dirname, "learning.html"),
        "smart-home": path.resolve(import.meta.dirname, "smart-home.html"),
        prosurvey: path.resolve(import.meta.dirname, "prosurvey.html"),
        payment: path.resolve(import.meta.dirname, "payment.html"),
        "admin/dashboard": path.resolve(import.meta.dirname, "admin/dashboard.html"),
=======
        admin: path.resolve(import.meta.dirname, "admin/dashboard.html"),
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: false },
<<<<<<< HEAD
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
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
