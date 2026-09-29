import { useState } from "react";
import { PERSONAS, getDay, getPersona, setDay, setPersona, type PersonaId } from "../lib/demo";

// 체험 데모 전용 상단 바: 로그인 없이 바로 보고, 사용자/진행일만 눌러서 바꾼다. 가짜 데이터라 서버에는 저장되지 않는다.
export default function DemoBar({ onChange }: { onChange: () => void }) {
  const [open, setOpen] = useState(true);
  const cur = getPersona(), day = getDay();
  const go = (id: PersonaId) => { setPersona(id); location.hash = id === "admin1" ? "#/admin" : "#/"; onChange(); };
  const chip = (on: boolean) => `min-h-9 shrink-0 rounded-full px-3 text-[13px] font-bold ${on ? "bg-gold text-ink" : "bg-white/10 text-paper"}`;
  return (
    <div className="sticky top-0 z-40 bg-ink px-3 py-2 text-paper">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gold">체험 데모 · 가짜 데이터</span>
          <button className="ml-auto min-h-9 px-2 text-xs underline" onClick={() => setOpen(!open)}>{open ? "접기" : "펴기"}</button>
        </div>
        {open && (
          <div className="mt-1.5 space-y-1.5">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {(Object.keys(PERSONAS) as PersonaId[]).map((id) => <button key={id} className={chip(cur === id)} onClick={() => go(id)}>{PERSONAS[id]}</button>)}
            </div>
            {cur === "u1" && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <span className="shrink-0 text-xs text-paper/70">진행일</span>
                {[1, 5, 10, 14, 18, 24, 26].map((d) => <button key={d} className={chip(day === d)} onClick={() => { setDay(d); onChange(); }}>{d}일차</button>)}
              </div>
            )}
            {cur === "new1" && <p className="text-xs text-paper/70">신청 → 입금했어요 → 관리자로 바꿔 입금 확인 → 다시 이 사용자로 돌아오면 승인 화면이 보여요.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
