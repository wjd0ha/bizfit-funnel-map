import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase, SUPABASE_URL, SUPABASE_KEY } from "../lib/supabase";
import { Button, Field, Notice } from "../components/ui";
import Logo, { Wordmark } from "../components/Logo";
import InAppBanner from "../components/InAppBanner";
import { DEMO } from "../lib/demo";

// S1: 로그인/가입. autocomplete 속성으로 기기의 비밀번호 관리자(지문/얼굴)가 채우게 한다.
export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [f, setF] = useState({ email: "", password: "", name: "", nickname: "", phone: "" });
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim().toLowerCase(), password: f.password });
    if (error) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (mode === "signup" && !DEMO) {
        if (!agree) throw new Error("개인정보 수집·이용에 동의해 주세요");
        const r = await fetch(`${SUPABASE_URL}/functions/v1/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          body: JSON.stringify({ ...f, privacy_agreed: true }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error(j.message || "가입에 실패했습니다");
      }
      await login();
    } catch (e2) { setErr((e2 as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen">
      <InAppBanner />
      <div className="mx-auto max-w-md px-5 py-12">
        <div className="mb-8 flex flex-col items-center gap-3"><Logo size={84} /><h1><Wordmark size={34} /></h1>
          <p className="text-[15px] text-ink/70">목표와 행동을 하루 한 번, 일치시켜요</p></div>
        <div className="mb-5 flex gap-1 rounded-full bg-ink/[0.06] p-1">
          {(["login", "signup"] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setErr(""); }}
              className={`min-h-11 flex-1 rounded-full font-semibold transition-colors ${mode === m ? "bg-white font-bold text-ink ring-1 ring-ink/10" : "text-ink/70"}`}>{m === "login" ? "로그인" : "가입"}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="이메일" type="email" name="username" autoComplete="username" inputMode="email" required value={f.email} onChange={set("email")} />
          <Field label="비밀번호" type="password" name="password" required minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"} value={f.password} onChange={set("password")}
            hint={mode === "signup" ? "8자 이상" : undefined} />
          {mode === "signup" && <>
            <Field label="성명" autoComplete="name" required value={f.name} onChange={set("name")} />
            <Field label="닉네임" required maxLength={20} value={f.nickname} onChange={set("nickname")} hint="마이 화면에서 언제든 바꿀 수 있어요" />
            <Field label="연락처" type="tel" inputMode="tel" autoComplete="tel" required placeholder="010-0000-0000" value={f.phone} onChange={set("phone")} />
            <label className="flex min-h-11 items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#B8892B]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>(필수) 개인정보 수집·이용에 동의합니다. <Link to="/privacy" target="_blank" className="underline">내용 보기</Link></span>
            </label>
          </>}
          {err && <Notice tone="error">{err}</Notice>}
          <Button type="submit" block disabled={busy} className="h-14 text-base">{busy ? "처리 중…" : mode === "login" ? "로그인" : "가입하고 시작하기"}</Button>
        </form>
        {DEMO && <p className="mt-4 rounded-2xl bg-gold-light px-4 py-3 text-sm">체험 데모예요. 위 바에서 사용자를 고르면 로그인 없이 바로 볼 수 있어요.</p>}
        <p className="mt-6 text-center text-sm text-ink/70"><Link to="/terms" className="underline">참여 규정</Link> · <Link to="/privacy" className="underline">개인정보 처리방침</Link></p>
      </div>
    </div>
  );
}
