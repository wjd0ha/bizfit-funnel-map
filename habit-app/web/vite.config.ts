import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "부행일치",
        short_name: "부행일치",
        description: "부자로 가는 행동 일치 — 매일 습관 인증",
        lang: "ko",
        start_url: "/",
        display: "standalone",
        background_color: "#FBF8F1",
        theme_color: "#B8892B",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      // 인증/정산은 서버 시각·데이터가 기준이므로 API 응답은 캐시하지 않는다(앱 셸만 캐시).
      workbox: { navigateFallbackDenylist: [/^\/functions\//] },
    }),
  ],
});
