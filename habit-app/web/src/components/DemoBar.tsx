import { useState } from "react";
import { PERSONAS, getDay, getPersona, setDay, setPersona, type PersonaId } from "../lib/demo";

// 체험 데모 전용 패널: 사용자 전환 + 기수 진행일 이동(문구/화면 변화를 확인). 가짜 데이터라 서버에 아무것도 저장되지 않는다.
export default function DemoBar({ onChange }: { onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const cur = getPersona(), day = getDay();
  const go = (id: PersonaId) => { setPersona(id); location.hash = id === "admin1" ? "#/admin" : "#/"; onChange(); };
  const chip = (on: boolean) => `min-h-11 rounded-full px-3 text-sm font-semibold ${on ? "bg-ink text-paper" : "bg-white text-ink ring-1 ring-ink/15"}`;
  return (
    <div className="fixed bottom-24 right-3 z-50 max-w-[calc(100vw-24px)]">
      {open && (
        <div className="mb-2 w-72 rounded-3xl bg-white p-4 ring-1 ring-ink/15">
          <p className="mb-1 text-xs font-bold text-ink/70">체험 데모 · 가짜 데이터</p>
          <p className="mb-1 mt-2 text-sm font-bold">누구로 볼까요?</p>
          <div className="flex flex-wrap gap-1.5">{(Object.keys(PERSONAS) as PersonaId[]).map((id) => <button key={id} className={chip(cur === id)} onClick={() => go(id)}>{PERSONAS[id]}</button>)}</div>
          <p className="mb-1 mt-3 text-sm font-bold">40기 진행일 (참가자 화면)</p>
          <div className="flex flex-wrap gap-1.5">{[1, 5, 10, 14, 18, 24, 26].map((d) => <button key={d} className={chip(day === d)} onClick={() => { setDay(d); onChange(); }}>{d}일차</button>)}</div>
          <p className="mt-3 text-xs text-ink/70">신규 가입자로 신청 → 관리자로 입금 확인 → 다시 신규 가입자로 돌아오면 전체 흐름을 볼 수 있어요.</p>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="ml-auto flex min-h-11 items-center rounded-full bg-gold px-4 text-sm font-bold text-ink ring-1 ring-ink/20">{open ? "닫기" : "데모 설정"}</button>
    </div>
  );
}
