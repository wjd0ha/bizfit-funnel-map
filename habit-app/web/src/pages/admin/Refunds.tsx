import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { rpc, supabase, type RpcResult } from "../../lib/supabase";
import { useAsync } from "../../lib/hooks";
import type { Membership } from "../../lib/types";
import { Button, Card, Notice, Spinner, copyText } from "../../components/ui";
import { fmtKst, won } from "../../lib/format";

type Row = Membership & { profiles: { name: string; nickname: string } | null };

// A5: 환급 — 계좌 정보는 이 화면에서만 본다. 환급 완료 처리 시 계좌 삭제.
export default function Refunds() {
  const { refreshCounts } = useOutletContext<{ refreshCounts: () => void }>();
  const list = useAsync(async () => ((await supabase.from("memberships").select("*, profiles(name,nickname)").eq("status", "ended").gt("deposit_balance", 0)).data ?? []) as Row[]);
  const [msg, setMsg] = useState(""); const [copied, setCopied] = useState<string | null>(null);
  if (list.loading) return <Spinner />;
  const all = list.data ?? [];
  const waiting = all.filter((r) => r.refund_requested_at && !r.refund_done_at);
  const notYet = all.filter((r) => !r.refund_requested_at);

  const done = async (r: Row) => {
    if (!confirm(`${r.profiles?.name}님께 ${won(r.deposit_balance)}을 송금하셨나요?\n완료 처리하면 계좌 정보가 삭제돼요.`)) return;
    try {
      const x = await rpc<RpcResult>("admin_mark_refunded", { p_user: r.user_id });
      if (!x.ok) setMsg(x.message ?? "처리하지 못했어요"); await list.reload(); refreshCounts();
    } catch (e) { setMsg((e as Error).message); }
  };
  const copy = async (r: Row) => {
    const t = `${r.refund_bank} ${r.refund_account} ${r.refund_holder} ${r.deposit_balance}`;
    if (await copyText(t)) { setCopied(r.user_id); setTimeout(() => setCopied(null), 1500); }
  };

  return (
    <div className="space-y-3">
      {msg && <Notice tone="error">{msg}</Notice>}
      <Card title={`환급 대기 (${waiting.length})`}>
        {waiting.length === 0 ? <p className="text-sm text-ink/60">대기 중인 환급이 없어요.</p> : (
          <div className="divide-y divide-ink/10">{waiting.map((r) => (
            <div key={r.user_id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div><b>{r.profiles?.name}</b> <span className="text-sm text-ink/60">({r.profiles?.nickname})</span><br />
                <span className="text-sm">{r.refund_bank} {r.refund_account} · 예금주 {r.refund_holder}</span><br />
                <span className="text-sm text-ink/60">신청 {fmtKst(r.refund_requested_at)}</span></div>
              <div className="text-right"><p className="text-lg font-bold tabular-nums">{won(r.deposit_balance)}</p>
                <div className="mt-1 flex gap-2"><Button variant="line" onClick={() => copy(r)}>{copied === r.user_id ? "복사됨" : "복사"}</Button><Button onClick={() => done(r)}>환급 완료</Button></div></div>
            </div>))}</div>
        )}
      </Card>
      <Card title={`환급 신청 전 (${notYet.length})`}>
        {notYet.length === 0 ? <p className="text-sm text-ink/60">없어요.</p> : (
          <ul className="divide-y divide-ink/10 text-sm">{notYet.map((r) => (
            <li key={r.user_id} className="flex justify-between py-2"><span>{r.profiles?.name} · 종료 {fmtKst(r.ended_at)}</span><b>{won(r.deposit_balance)}</b></li>))}</ul>
        )}
        <p className="mt-2 text-xs text-ink/60">참가자가 앱에서 환급 신청(계좌 입력)을 해야 대기 목록으로 넘어와요.</p>
      </Card>
    </div>
  );
}
