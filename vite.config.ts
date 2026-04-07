import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mediaUploadPlugin } from "./vite-plugin-media-upload";
import { redirectSyncPlugin } from "./vite-plugin-redirect-sync";
import { trackingSyncPlugin } from "./vite-plugin-tracking-sync";
import { sitemapPlugin } from "./vite-plugin-sitemap";
import { htaccessPlugin } from "./vite-plugin-htaccess";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
    sitemapPlugin(),
    htaccessPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
