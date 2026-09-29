import { useState } from "react";
import { rpc, supabase, type RpcResult } from "../lib/supabase";
import { useAsync } from "../lib/hooks";
import type { Home, Membership } from "../lib/types";
import { Button, Card, Field, Notice, Spinner } from "../components/ui";

// S9: 정산 신청 (25~28일차만). 신청하지 않으면 자동 연장.
export default function Stop() {
  const st = useAsync(async () => {
    const [h, { data: m }] = await Promise.all([rpc<Home>("get_home"), supabase.from("memberships").select("*").maybeSingle()]);
    return { h, m: m as Membership | null };
  });
  const [f, setF] = useState({ bank: "", account: "", holder: "" }); const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  if (st.loading) return <Spinner />;
  const { h, m } = st.data!;
  const inWindow = h.phase === "in_cohort" && (h.day_no ?? 0) >= 25;
  if (!inWindow) return <Notice>중단 신청은 기수 25일차부터 28일차 23:59까지 할 수 있어요. 신청하지 않으면 자동 연장돼요.</Notice>;

  const run = async (fn: string, args?: Record<string, unknown>) => {
    setBusy(true); setMsg("");
    try { const r = await rpc<RpcResult>(fn, args); if (!r.ok) setMsg(r.message ?? "처리하지 못했어요"); else await st.reload(); }
    catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  if (m?.stop_requested) return (
    <div className="space-y-3">
      <Card title="연장 중단 신청 완료">
        <p>{h.cohort_no}기 종료 후 남은 보증금을 환급해 드려요. (이번 기수 결과에 따라 차감될 수 있어요)</p>
        <p className="mt-2 text-sm text-ink/70">28일차 23:59 전까지는 취소할 수 있어요.</p>
      </Card>
      {msg && <Notice tone="error">{msg}</Notice>}
      <Button variant="line" block disabled={busy} onClick={() => run("cancel_stop")}>중단 신청 취소(연장 유지)</Button>
    </div>
  );
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">연장 중단 / 환급계좌</h1>
      <Notice>중단하면 이번 기수 종료 후 남은 보증금을 환급해 드려요. 신청하지 않으면 다음 기수로 자동 연장돼요.</Notice>
      <Field label="은행" value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} />
      <Field label="계좌번호" inputMode="numeric" value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })} />
      <Field label="예금주" value={f.holder} onChange={(e) => setF({ ...f, holder: e.target.value })} />
      <label className="flex min-h-11 items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-[#B8892B]" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <span>본인 명의 계좌이며, 중단 시 다음 기수에 참여하지 않음을 확인했어요.</span>
      </label>
      {msg && <Notice tone="error">{msg}</Notice>}
      <Button block disabled={busy || !ok || !f.bank || !f.account || !f.holder}
        onClick={() => run("request_stop", { p_bank: f.bank, p_account: f.account, p_holder: f.holder })}>연장 중단 신청</Button>
    </div>
  );
}
