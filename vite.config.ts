import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    // Minify aggressively — terser produces smaller output than esbuild for large data files
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
    },
    // Increase chunk size warning limit since question banks are intentionally large
    chunkSizeWarningLimit: 1500,
    // ── Code splitting — keep large question bank files out of the main bundle ──
    rollupOptions: {
      output: {
                chunkFileNames: (chunkInfo) => {
          return `assets/[name]-[hash]-${Date.now()}.js`;
        },
        entryFileNames: (chunkInfo) => {
          return `assets/[name]-[hash]-${Date.now()}.js`;
        },
        manualChunks(id) {
          // Split the large science question banks into their own lazy chunks
          if (id.includes("questionBankBiology")) return "qbank-biology";
          if (id.includes("questionBankChemistry")) return "qbank-chemistry";
          if (id.includes("questionBankPhysics")) return "qbank-physics";
          if (id.includes("questionBankExpanded")) return "qbank-expanded";
          if (id.includes("questionBankMaths")) return "qbank-maths";
          if (id.includes("questionBankEnglish")) return "qbank-english";
          if (id.includes("questionBankOtherSubjects")) return "qbank-other";
          if (id.includes("pastPaperQuestionsExpanded")) return "qbank-expanded";
          if (id.includes("pastPaperQuestions")) return "qbank-pastpapers";
          if (id.includes("examPaperBuilder")) return "qbank-pastpapers";
          // Vendor chunk for large stable dependencies
          if (id.includes("node_modules")) {
            if (id.includes("react-dom")) return "vendor-react";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("recharts")) return "vendor-charts";
            return "vendor";
          }
        },
      },
    },
  },
  // ── Dev proxy — forward /api/* to the Express server on port 3001 ──────────
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
