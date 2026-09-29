import { useState } from "react";
import { Link } from "react-router-dom";
import { rpc, supabase, type RpcResult } from "../lib/supabase";
import { useAsync, useInterval } from "../lib/hooks";
import type { ApplyInfo, Home as HomeT, Membership } from "../lib/types";
import { Button, Card, Muted, Notice, Row, Spinner, copyText } from "../components/ui";
import Gauge from "../components/Gauge";
import PayBox from "../components/PayBox";
import { fmtDate, fmtKst } from "../lib/format";
import { useInfo } from "./Legal";

export default function Home() {
  const home = useAsync(() => rpc<HomeT>("get_home"));
  const mem = useAsync(async () => {
    const { data } = await supabase.from("memberships").select("*").maybeSingle();
    return data as Membership | null;
  });
  useInterval(() => { home.reload(); }, 60_000); // 인증 가능 시간 경계를 넘으면 서버 값으로 갱신
  const info = useInfo();
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const h = home.data;

  if (home.loading || mem.loading) return <Spinner />;
  if (home.error || !h) return <Notice tone="error">{home.error ?? "불러오지 못했습니다"}</Notice>;

  const reloadAll = () => { home.reload(); mem.reload(); };
  if (h.phase === "none" || h.phase === "ended") return <NoCohort h={h} m={mem.data} />;
  if (h.participation_status === "pending_payment") return <ApplyStatus h={h} reload={reloadAll} />;

  const checkin = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await rpc<RpcResult>("check_in");
      if (!r.ok && r.code !== "already_checked") setMsg(r.message ?? "인증하지 못했습니다");
      await home.reload();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  const inCohort = h.phase === "in_cohort";
  const label = h.checked_today ? "오늘 인증 완료" : h.can_checkin ? "습관 인증 완료" : inCohort ? `인증 가능 시간 ${info.data?.checkin_start ?? "07:00"}~${info.data?.checkin_end ?? "23:59"}` : `시작일 ${fmtDate(h.start_date)}`;
  const d = h.day_no ?? 0;

  return (
    <>
      <p className="mb-3 rounded-lg bg-gold-light px-3 py-2 text-center text-sm font-semibold">28일 중 8일은 쉬어도 됩니다</p>
      {inCohort
        ? <p className="mb-2 text-center text-ink/70">{h.cohort_no}기 · {d}일차 · 남은 {h.days_left}일</p>
        : <p className="mb-2 text-center text-ink/70">{h.cohort_no}기 시작 {fmtDate(h.start_date)}</p>}
      <Gauge percent={h.percent ?? 0} count={h.count ?? 0} goal={h.goal ?? 20} />
      <div className="mt-5 space-y-3">
        {h.participation_status === "topup_pending" && (
          <>
            <Notice tone="warn">보증금 재납부가 필요해요. 기한: {fmtKst(h.topup_due_at)}까지 (미납 시 이번 기수 참여가 취소돼요)</Notice>
            <PayBox kind="topup" title="보증금 재납부" onChanged={reloadAll} />
          </>
        )}
        <Card title="오늘의 나와의 약속">
          {h.habits && h.habits.length > 0
            ? <ul className="space-y-1">{h.habits.map((x, i) => <li key={i} className="flex gap-2"><span className="text-gold">●</span>{x}</li>)}</ul>
            : <Muted>아직 습관이 없어요.</Muted>}
          <p className="mt-2 text-sm text-ink/60">이 중 하나만 실천해도 오늘은 인정돼요.</p>
          <Link to="/habits" className="mt-2 inline-flex min-h-11 items-center text-sm underline">습관 {h.habits?.length ? "수정" : "설정"}하기</Link>
        </Card>
        {h.chat && (
          <Card title="단톡방">
            <Row k="링크" v={<a href={h.chat.url} target="_blank" rel="noreferrer" className="break-all underline">{h.chat.url || "(준비 중)"}</a>} />
            <Row k="비밀번호" v={h.chat.password || "-"} />
            <p className="mt-1 text-sm text-ink/60">인증 사진은 단톡방에 올려 주세요.</p>
            {h.chat.password && <Button variant="line" className="mt-2" onClick={() => copyText(h.chat!.password)}>비밀번호 복사</Button>}
          </Card>
        )}
        {inCohort && d >= 25 && (
          <Card title="정산 신청 기간이에요"><p className="mb-2 text-sm">연장을 원하지 않으면 28일차 23:59까지 중단 신청을 해 주세요. 신청하지 않으면 자동 연장돼요.</p>
            <Link to="/stop" className="inline-flex min-h-11 items-center underline">중단 신청 / 환급계좌 입력</Link></Card>
        )}
        {msg && <Notice tone="error">{msg}</Notice>}
      </div>

      {/* 하단 고정 인증 버튼 (56px 이상, safe-area 적용) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-ink/10 bg-paper px-4 pt-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto max-w-md">
          <Button block className="h-14 text-lg" disabled={!h.can_checkin || busy} onClick={checkin}>{busy ? "처리 중…" : label}</Button>
        </div>
      </div>
    </>
  );
}

function NoCohort({ h, m }: { h: HomeT; m: Membership | null }) {
  const apply = useAsync(() => rpc<ApplyInfo>("get_apply_info"));
  const last = useAsync(async () => {
    const { data } = await supabase.from("participations").select("cohort_no,result").neq("result", "pending").order("cohort_no", { ascending: false }).limit(1).maybeSingle();
    return data as { cohort_no: number; result: string } | null;
  });
  const recruiting = (apply.data?.cohorts ?? []).length > 0;
  const refundable = m && m.status === "ended" && m.deposit_balance > 0 && !m.refund_done_at;
  return (
    <div className="space-y-3">
      {m?.status === "active" && <Card title="정산 진행 중"><p>기수 결과를 정산하고 있어요. 곧 다음 기수 안내가 나옵니다.</p></Card>}
      {h.next_cohort_start && <Card title="다음 기수 시작일"><p className="text-2xl font-bold">{fmtDate(h.next_cohort_start)}</p></Card>}
      {last.data && <Card title="지난 기수 결과"><Link to="/result" className="underline">{last.data.cohort_no}기 결과 보기</Link></Card>}
      {refundable && <Card title="보증금 환급"><p className="mb-2">남은 보증금을 환급받을 수 있어요.</p><Link to="/refund" className="underline">환급 신청하기</Link></Card>}
      {recruiting
        ? <Card title="모집 중"><p className="mb-3">{apply.data!.cohorts.map((c) => `${c.no}기`).join(", ")} 신청을 받고 있어요.</p><Link to="/apply"><Button block>신청하기</Button></Link></Card>
        : !m?.status || m.status === "ended" ? <Card><p>지금은 모집 중인 기수가 없어요. 모집이 열리면 여기에 신청 버튼이 나타납니다.</p></Card> : null}
    </div>
  );
}

// S3: 신청 완료 / 입금 확인 상태
function ApplyStatus({ h, reload }: { h: HomeT; reload: () => void }) {
  return (
    <div className="space-y-3">
      <Card title={`${h.cohort_no}기 신청 완료`}>
        <Row k="시작일" v={fmtDate(h.start_date)} />
        <p className="mt-2 text-sm text-ink/70">입금이 확인되면 시작 전 토요일 00:00부터 단톡방 링크와 비밀번호가 이 화면에 나타나요.</p>
      </Card>
      <PayBox kind="initial" title="입금 안내" onChanged={reload} />
    </div>
  );
}
