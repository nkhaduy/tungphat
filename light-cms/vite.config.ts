import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    target: "es2022",
    rollupOptions: { output: { manualChunks: { react: ["react", "react-dom"] } } },
  },
});
