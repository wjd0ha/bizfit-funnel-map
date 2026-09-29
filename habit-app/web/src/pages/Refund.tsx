import { useState } from "react";
import { rpc, supabase, type RpcResult } from "../lib/supabase";
import { useAsync } from "../lib/hooks";
import type { Membership } from "../lib/types";
import { Button, Card, Field, Notice, Row, Spinner } from "../components/ui";
import { fmtKst, won } from "../lib/format";
import { useInfo } from "./Legal";

// S10: 환급 신청 (종료 상태 + 잔액이 있을 때만)
export default function Refund() {
  const st = useAsync(async () => (await supabase.from("memberships").select("*").maybeSingle()).data as Membership | null);
  const info = useInfo();
  const [f, setF] = useState({ bank: "", account: "", holder: "" }); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  if (st.loading) return <Spinner />;
  const m = st.data;
  if (!m || m.status !== "ended") return <Notice>환급 대상이 아니에요.</Notice>;
  if (m.refund_done_at) return <Card title="환급 완료"><p>보증금 환급이 완료됐어요. ({fmtKst(m.refund_done_at)})</p></Card>;
  if (m.deposit_balance <= 0) return <Notice>환급할 보증금이 없어요.</Notice>;
  if (m.refund_requested_at) {
    return (
      <Card title="환급 신청 완료"><Row k="환급 금액" v={won(m.deposit_balance)} />
        <p className="mt-2 text-sm text-ink/70">운영자가 확인 후 입금해 드려요. 환급이 끝나면 계좌 정보는 삭제돼요.</p></Card>
    );
  }
  const submit = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await rpc<RpcResult>("request_refund", { p_bank: f.bank, p_account: f.account, p_holder: f.holder });
      if (!r.ok) setMsg(r.message ?? "신청하지 못했어요"); else await st.reload();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">보증금 환급 신청</h1>
      <Card><Row k="환급 금액" v={won(m.deposit_balance)} /><p className="mt-1 text-sm text-ink/70">종료일부터 {info.data?.refund_claim_days ?? 90}일 이내에 신청해 주세요.</p></Card>
      <Field label="은행" value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} />
      <Field label="계좌번호" inputMode="numeric" value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })} />
      <Field label="예금주" value={f.holder} onChange={(e) => setF({ ...f, holder: e.target.value })} />
      {msg && <Notice tone="error">{msg}</Notice>}
      <Button block disabled={busy || !f.bank || !f.account || !f.holder} onClick={submit}>환급 신청</Button>
    </div>
  );
}
