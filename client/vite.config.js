import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/

// export default defineConfig({
//   plugins: [react()],
// })

export default defineConfig({
  server: {
    host: "0.0.0.0", // 让其他设备可访问
    port: 5173,
  },
  plugins: [react()],
});
