import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rpc, type RpcResult } from "../lib/supabase";
import { useAsync } from "../lib/hooks";
import type { Home } from "../lib/types";
import { Button, Field, Notice, Spinner } from "../components/ui";

// S4: 습관 1~3개. 기수 1일차 23:59까지 수정 가능(서버가 판정)
export default function Habits() {
  const home = useAsync(() => rpc<Home>("get_home"));
  const nav = useNavigate();
  const [v, setV] = useState(["", "", ""]); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (home.data?.habits) setV([0, 1, 2].map((i) => home.data!.habits![i] ?? "")); }, [home.data]);
  if (home.loading) return <Spinner />;
  const h = home.data;
  if (!h?.cohort_no) return <Notice>참여 중인 기수가 없어요.</Notice>;
  const locked = h.phase === "in_cohort" && (h.day_no ?? 0) > 1;

  const save = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await rpc<RpcResult>("set_habits", { p_cohort_no: h.cohort_no, p_habits: v });
      if (!r.ok) setMsg(r.message ?? "저장하지 못했어요"); else nav("/", { replace: true });
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{h.cohort_no}기 목표 습관</h1>
      <p className="text-sm text-ink/70">1~3개를 정해 주세요. 그중 하나만 실천해도 그날은 인증할 수 있어요. 기수 1일차 23:59까지만 수정할 수 있어요.</p>
      {locked && <Notice tone="warn">수정 가능 기간이 지나 잠겼어요.</Notice>}
      {v.map((x, i) => <Field key={i} label={`습관 ${i + 1}${i === 0 ? " (필수)" : ""}`} value={x} maxLength={60} disabled={locked}
        onChange={(e) => setV(v.map((y, j) => (j === i ? e.target.value : y)))} />)}
      {msg && <Notice tone="error">{msg}</Notice>}
      <Button block disabled={busy || locked || !v[0].trim()} onClick={save}>저장</Button>
    </div>
  );
}
