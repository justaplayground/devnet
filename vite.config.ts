import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Optional: import vite-plugin-compression for gzip/brotli
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/devnet/", // remove this when the project is deployed as a standalone
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Optional: enable gzip/brotli compression for production builds
    mode === "production" && viteCompression({ algorithm: "brotliCompress" }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext", // or 'es2017' for wider compatibility
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: mode === "development",
    chunkSizeWarningLimit: 600, // KB
    assetsInlineLimit: 4096, // 4kb, adjust as needed
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id.toString().split("node_modules/")[1].split("/")[0].toString();
          }
        },
      },
    },
    brotliSize: true,
    // Enable cache for faster rebuilds
    // cacheDir: 'node_modules/.vite',
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    esbuildOptions: {
      target: "esnext",
    },
  },
}));
