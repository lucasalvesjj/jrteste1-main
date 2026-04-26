import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mediaUploadPlugin } from "./vite-plugin-media-upload";
import { redirectSyncPlugin } from "./vite-plugin-redirect-sync";
import { trackingSyncPlugin } from "./vite-plugin-tracking-sync";
import { seoSyncPlugin } from "./vite-plugin-seo-sync";
import { sitemapPlugin } from "./vite-plugin-sitemap";
import { routeSeoPlugin } from "./vite-plugin-route-seo";
import { htaccessPlugin } from "./vite-plugin-htaccess";
import { cloudflareRedirectsPlugin } from "./vite-plugin-cloudflare-redirects";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      host: "192.168.10.156",
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "development" && mediaUploadPlugin(),
    mode === "development" && redirectSyncPlugin(),
    mode === "development" && trackingSyncPlugin(),
    seoSyncPlugin(),
    sitemapPlugin(),
    routeSeoPlugin(),
    htaccessPlugin(),
    cloudflareRedirectsPlugin(),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["framer-motion", "embla-carousel-react"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
