import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// 운영은 필요한 글자 조각만 받는 dynamic-subset, 데모는 단일 파일
if (import.meta.env.VITE_DEMO === "1") import("pretendard/dist/web/variable/pretendardvariable.css"); else import("pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css");

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
