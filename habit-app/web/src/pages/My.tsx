import { useState } from "react";
import { Link } from "react-router-dom";
import { rpc, supabase, type RpcResult } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useAsync } from "../lib/hooks";
import type { Membership, Payment } from "../lib/types";
import { Button, Card, Field, Muted, Notice, Row, Spinner } from "../components/ui";
import { KIND_LABEL, MEMBER_STATUS, PAY_STATUS, fmtKst, won } from "../lib/format";

type Ledger = { id: number; delta: number; reason: string; created_at: string; cohort_no: number | null };
const REASON: Record<string, string> = { deposit_in: "보증금 입금", forfeit: "보증금 차감", topup: "재납부", refund_out: "환급" };

// S8: 마이 (닉네임 수정, 결제·보증금 내역, 규정)
export default function My() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [nick, setNick] = useState(profile?.nickname ?? ""); const [msg, setMsg] = useState("");
  const st = useAsync(async () => {
    const [m, p, l] = await Promise.all([
      supabase.from("memberships").select("*").maybeSingle(),
      supabase.from("payments").select("*").order("id", { ascending: false }),
      supabase.from("deposit_ledger").select("*").order("id", { ascending: false }),
    ]);
    return { m: m.data as Membership | null, p: (p.data ?? []) as Payment[], l: (l.data ?? []) as Ledger[] };
  });
  if (!profile || st.loading) return <Spinner />;
  const save = async () => {
    setMsg("");
    try {
      const r = await rpc<RpcResult>("update_nickname", { p_new: nick });
      if (!r.ok) setMsg(r.message ?? "변경하지 못했어요"); else { await refreshProfile(); setMsg("변경했어요"); }
    } catch (e) { setMsg((e as Error).message); }
  };
  const { m, p, l } = st.data!;
  return (
    <div className="space-y-3">
      <Card title="내 정보">
        <Row k="성명" v={profile.name} /><Row k="이메일" v={profile.email} /><Row k="연락처" v={profile.phone} />
        {m && <Row k="상태" v={MEMBER_STATUS[m.status]} />}
        <div className="mt-3 space-y-2">
          <Field label="닉네임" maxLength={20} value={nick} onChange={(e) => setNick(e.target.value)} />
          <Button variant="line" disabled={!nick.trim() || nick.trim() === profile.nickname} onClick={save}>닉네임 저장</Button>
          {msg && <Notice>{msg}</Notice>}
        </div>
      </Card>
      <Card title="보증금">
        <p className="text-2xl font-bold">{won(m?.deposit_balance ?? 0)}</p>
        {l.length === 0 ? <Muted>내역이 없어요.</Muted> : (
          <ul className="mt-2 divide-y divide-ink/10 text-sm">
            {l.map((x) => (
              <li key={x.id} className="flex justify-between py-2">
                <span>{REASON[x.reason]}{x.cohort_no ? ` (${x.cohort_no}기)` : ""}<br /><span className="text-ink/60">{fmtKst(x.created_at)}</span></span>
                <b className="tabular-nums">{x.delta > 0 ? "+" : ""}{x.delta.toLocaleString()}</b>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="결제 내역">
        {p.length === 0 ? <Muted>내역이 없어요.</Muted> : (
          <ul className="divide-y divide-ink/10 text-sm">
            {p.map((x) => (
              <li key={x.id} className="flex justify-between py-2">
                <span>{KIND_LABEL[x.kind]} · {x.cohort_no}기<br /><span className="text-ink/60">{PAY_STATUS[x.status]} · {fmtKst(x.created_at)}</span></span>
                <b className="tabular-nums">{won(x.amount)}</b>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/terms" className="underline">참여 규정</Link><Link to="/privacy" className="underline">개인정보 처리방침</Link><Link to="/result" className="underline">지난 기수 결과</Link>
      </div>
      <Button variant="line" block onClick={signOut}>로그아웃</Button>
    </div>
  );
}
