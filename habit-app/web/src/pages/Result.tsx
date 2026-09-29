import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAsync } from "../lib/hooks";
import type { Membership } from "../lib/types";
import { Card, Notice, Row, Spinner } from "../components/ui";
import PayBox from "../components/PayBox";
import { RESULT_LABEL, fmtDate, won } from "../lib/format";

// S7: 기수 결과 + 재납부 안내
export default function Result() {
  const st = useAsync(async () => {
    const { data: p } = await supabase.from("participations").select("cohort_no,result,status,topup_due_at").neq("result", "pending").order("cohort_no", { ascending: false }).limit(1).maybeSingle();
    if (!p) return null;
    const [{ count }, { data: m }, { data: next }] = await Promise.all([
      supabase.from("checkins").select("*", { count: "exact", head: true }).eq("cohort_no", p.cohort_no),
      supabase.from("memberships").select("*").maybeSingle(),
      supabase.from("participations").select("status,topup_due_at,cohort_no").gt("cohort_no", p.cohort_no).order("cohort_no").limit(1).maybeSingle(),
    ]);
    return { p, count: count ?? 0, m: m as Membership | null, next };
  });
  if (st.loading) return <Spinner />;
  const s = st.data;
  if (!s) return <Notice>아직 정산된 기수가 없어요.</Notice>;
  const { p, count, m, next } = s;
  const msg: Record<string, string> = {
    success: "축하해요! 보증금이 유지되고 다음 기수로 자동 연장돼요. 추가 납부는 없어요.",
    partial: "보증금 1만원이 차감됐어요. 이어가려면 1만원을 재납부해 주세요.",
    fail: "보증금 2만원이 차감됐어요. 이어가려면 2만원을 다시 납부해 주세요.",
  };
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{p.cohort_no}기 결과</h1>
      <Card>
        <p className="text-3xl font-bold">{RESULT_LABEL[p.result]}</p>
        <p className="mt-1 text-ink/70">28일 중 {count}일 인증</p>
        <p className="mt-3">{msg[p.result]}</p>
        <div className="mt-3 border-t border-ink/10 pt-2"><Row k="보증금 잔액" v={won(m?.deposit_balance ?? 0)} /></div>
      </Card>
      {m?.status === "ended" && (
        <Card><p>참여가 종료됐어요.</p>
          {m.deposit_balance > 0 && !m.refund_done_at && <Link to="/refund" className="mt-1 inline-block underline">남은 보증금 환급 신청</Link>}</Card>
      )}
      {next?.status === "topup_pending" && (
        <>
          <Notice tone="warn">{next.cohort_no}기 재납부 기한: {fmtDate(next.topup_due_at)} 23:59까지. 기한이 지나면 {next.cohort_no}기 참여가 취소돼요. 그 전까지도 인증은 할 수 있어요.</Notice>
          <PayBox kind="topup" title="보증금 재납부" onChanged={st.reload} />
        </>
      )}
    </div>
  );
}
