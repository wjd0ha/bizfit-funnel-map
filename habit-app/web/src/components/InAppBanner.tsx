import { useState } from "react";

// 카카오톡 인앱 브라우저는 로그인 유지/홈 화면 추가가 안 될 수 있어 안내한다.
export default function InAppBanner() {
  const ua = navigator.userAgent;
  const inApp = /KAKAOTALK/i.test(ua);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
  const [closed, setClosed] = useState(() => { try { return localStorage.getItem("bhic-banner") === "1"; } catch { return false; } });
  if (closed || standalone) return null;
  const isIos = /iPhone|iPad/i.test(ua);
  const close = () => { try { localStorage.setItem("bhic-banner", "1"); } catch { /* 무시 */ } setClosed(true); };
  if (!inApp && !isIos && !/Android/i.test(ua)) return null;
  return (
    <div className="border-b border-gold bg-gold-light px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-md items-start justify-between gap-3">
        <p>
          {inApp
            ? <>카카오톡 안에서는 로그인이 자주 풀릴 수 있어요. <b>{isIos ? "Safari" : "Chrome"}에서 열기</b> 후 <b>홈 화면에 추가</b>해 주세요.</>
            : <>{isIos ? "Safari 공유 버튼 → 홈 화면에 추가" : "Chrome 메뉴 → 홈 화면에 추가"}하면 앱처럼 쓸 수 있어요.</>}
        </p>
        <button onClick={close} className="min-h-11 min-w-11 shrink-0 font-semibold" aria-label="안내 닫기">닫기</button>
      </div>
    </div>
  );
}
