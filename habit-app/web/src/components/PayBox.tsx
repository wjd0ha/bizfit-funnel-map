import { useState } from "react";
import { supabase, rpc, type RpcResult } from "../lib/supabase";
import { useAsync } from "../lib/hooks";
import type { ApplyInfo, Payment } from "../lib/types";
import { Button, Card, Field, Notice, Row, copyText } from "./ui";
import { won, PAY_STATUS } from "../lib/format";

// 입금 안내 + "입금했어요" (신청 kind=initial / 재납부 kind=topup)
export default function PayBox({ kind, title, onChanged }: { kind: "initial" | "topup"; title: string; onChanged?: () => void }) {
  const pay = useAsync(async () => {
    const { data } = await supabase.from("payments").select("*").eq("kind", kind).order("id", { ascending: false }).limit(1).maybeSingle();
    return data as Payment | null;
  }, [kind]);
  const bank = useAsync(() => rpc<ApplyInfo>("get_apply_info"));
  const [name, setName] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const p = pay.data, b = bank.data;
  if (!p || !b) return null;
  const dn = name || p.depositor_name || "";

  const claim = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await rpc<RpcResult>("claim_payment", { p_kind: kind, p_depositor_name: dn });
      if (!r.ok) setMsg(r.message ?? "처리하지 못했습니다"); else { await pay.reload(); onChanged?.(); }
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Card title={title}>
      <Row k="입금 금액" v={won(p.amount)} />
      <Row k="입금 계좌" v={<>{b.bank_name} {b.bank_account}<br /><span className="font-normal text-ink/60">예금주 {b.bank_holder}</span></>} />
      <Row k="상태" v={PAY_STATUS[p.status]} />
      {b.bank_account && <Button variant="line" className="mt-2" onClick={() => copyText(b.bank_account)}>계좌번호 복사</Button>}
      {(p.status === "awaiting" || p.status === "rejected") && (
        <div className="mt-3 space-y-2">
          {p.status === "rejected" && <Notice tone="warn">입금이 확인되지 않았어요. 입금자명을 확인하고 다시 눌러 주세요.</Notice>}
          <Field label="입금자명" value={dn} onChange={(e) => setName(e.target.value)} hint="통장에 찍히는 이름과 똑같이 적어 주세요" />
          <Button block disabled={busy || !dn.trim()} onClick={claim}>입금했어요</Button>
          {msg && <Notice tone="error">{msg}</Notice>}
        </div>
      )}
      {p.status === "claimed" && <div className="mt-3"><Notice>입금 확인 중이에요. 운영자가 확인하면 자동으로 반영됩니다.</Notice></div>}
    </Card>
  );
}
