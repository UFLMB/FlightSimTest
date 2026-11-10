import { defineConfig } from "vite";
export default defineConfig({
  base: "/FlightSimTest/",
  build: { target: "es2022", sourcemap: true, assetsInlineLimit: 4096 },
  server: { host: "0.0.0.0" }
});