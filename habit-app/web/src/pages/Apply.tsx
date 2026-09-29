import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { rpc, type RpcResult } from "../lib/supabase";
import { useAsync } from "../lib/hooks";
import type { ApplyInfo } from "../lib/types";
import { Button, Card, Field, Notice, Row, Spinner } from "../components/ui";
import { fmtDate, fmtKst, won } from "../lib/format";
import { RulesText, useInfo } from "./Legal";

// S2: 신청 (모집 중일 때만 기수가 보인다)
export default function Apply() {
  const info = useAsync(() => rpc<ApplyInfo>("get_apply_info"));
  const pub = useInfo();
  const nav = useNavigate();
  const [cohort, setCohort] = useState<number | null>(null);
  const [name, setName] = useState(""); const [agree, setAgree] = useState(false);
  const [full, setFull] = useState(false); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  if (info.loading || pub.loading) return <Spinner />;
  const d = info.data, p = pub.data;
  if (!d || !p) return <Notice tone="error">{info.error ?? "불러오지 못했습니다"}</Notice>;
  if (d.cohorts.length === 0) return <Card><p>지금은 모집 중인 기수가 없어요.</p><Link to="/" className="mt-2 inline-block underline">홈으로</Link></Card>;
  const sel = cohort ?? d.cohorts[0].no;
  const c = d.cohorts.find((x) => x.no === sel)!;

  const submit = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await rpc<RpcResult>("apply", { p_cohort_no: sel, p_depositor_name: name, p_terms_agreed: agree });
      if (!r.ok) setMsg(r.message ?? "신청하지 못했습니다"); else nav("/", { replace: true });
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">기수 신청</h1>
      {d.cohorts.length > 1 && (
        <select className="min-h-11 w-full rounded-lg border border-ink/25 bg-white px-3" value={sel} onChange={(e) => setCohort(Number(e.target.value))}>
          {d.cohorts.map((x) => <option key={x.no} value={x.no}>{x.no}기 ({fmtDate(x.start_date)} 시작)</option>)}
        </select>
      )}
      <Card title={`${c.no}기`}>
        <Row k="기간" v={`${fmtDate(c.start_date)} ~ ${fmtDate(c.end_date)}`} />
        {c.apply_deadline && <Row k="신청 마감" v={fmtKst(c.apply_deadline)} />}
        <Row k="입금 금액" v={won(d.amount)} />
      </Card>
      <Card title="참여 규정 요약">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>참가비 {won(p.fee_amount)}(최초 1회) + 보증금 {won(p.deposit_amount)}</li>
          <li>매일 {p.checkin_start}~{p.checkin_end} 하루 1회 인증, 28일 중 20일 이상이면 성공</li>
          <li>18~19일은 보증금 1만원, 17일 이하는 2만원 차감(다음 기수 재납부)</li>
          <li>기수 시작 후에는 환불되지 않아요. 시작 전에는 전액 환불돼요.</li>
        </ul>
        <button className="mt-2 min-h-11 text-sm underline" onClick={() => setFull(!full)}>{full ? "전문 접기" : "전문 보기"}</button>
        {full && <div className="mt-2 border-t border-ink/10 pt-3 text-sm"><RulesText i={p} /></div>}
      </Card>
      <label className="flex min-h-11 items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-[#B8892B]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>(필수) 참여 규정에 동의합니다.</span>
      </label>
      <Card title="입금 안내">
        <Row k="은행/계좌" v={`${d.bank_name} ${d.bank_account}`} /><Row k="예금주" v={d.bank_holder} />
        <div className="mt-2"><Field label="입금자명" value={name} onChange={(e) => setName(e.target.value)} hint="통장에 찍히는 이름과 똑같이 적어 주세요" /></div>
      </Card>
      {msg && <Notice tone="error">{msg}</Notice>}
      <Button block className="h-12" disabled={busy || !agree || !name.trim()} onClick={submit}>{busy ? "처리 중…" : "신청하기"}</Button>
      <p className="text-center text-sm text-ink/70">신청 후 입금하고 &lsquo;입금했어요&rsquo;를 눌러 주세요.</p>
    </div>
  );
}
