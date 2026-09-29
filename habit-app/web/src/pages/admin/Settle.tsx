import { useState } from "react";
import { rpc, type RpcResult } from "../../lib/supabase";
import { useAsync } from "../../lib/hooks";
import type { AdminParticipant } from "../../lib/types";
import { Button, Card, Notice, Spinner } from "../../components/ui";
import { RESULT_LABEL, fmtDate, won } from "../../lib/format";
import { downloadCsv } from "../../lib/csv";
import { CohortSelect, useCohortPick } from "./Members";

// A4: 정산 — 허위 인증 성공 취소 표시 → 정산 확정 → 결과별 목록/재납부 대상
export default function Settle() {
  const pick = useCohortPick();
  const cohort = pick.cohorts.data?.find((c) => c.no === pick.no);
  const list = useAsync(async () => (pick.no == null ? [] : await rpc<AdminParticipant[]>("admin_participants", { p_cohort: pick.no })), [pick.no, cohort?.finalized_at]);
  const [msg, setMsg] = useState<{ t: "info" | "error"; s: string } | null>(null); const [busy, setBusy] = useState(false);
  if (pick.cohorts.loading || list.loading) return <Spinner />;
  const rows = list.data ?? [];
  const finalized = !!cohort?.finalized_at;
  const by = (r: string) => rows.filter((x) => x.result === r);

  const finalize = async () => {
    if (!confirm(`${pick.no}기를 정산 확정할까요?\n허위 인증 검토가 끝났는지 확인하세요. 확정 후에는 되돌릴 수 없어요.`)) return;
    setBusy(true); setMsg(null);
    try {
      const r = await rpc<RpcResult & { settled?: number; rolled_over?: number }>("finalize_cohort", { p_cohort_no: pick.no });
      setMsg(r.ok ? { t: "info", s: r.already ? "이미 정산된 기수예요" : `정산 완료: ${r.settled}명, 다음 기수 자동 연장 ${r.rolled_over}명` } : { t: "error", s: r.message ?? "정산하지 못했어요" });
      await pick.cohorts.reload(); await list.reload();
    } catch (e) { setMsg({ t: "error", s: (e as Error).message }); } finally { setBusy(false); }
  };
  const revoke = async (r: AdminParticipant) => {
    try {
      const x = await rpc<RpcResult>("admin_set_revoked", { p_user: r.user_id, p_cohort: pick.no, p_revoked: !r.revoked });
      if (!x.ok) setMsg({ t: "error", s: x.message ?? "처리하지 못했어요" }); await list.reload();
    } catch (e) { setMsg({ t: "error", s: (e as Error).message }); }
  };
  const topups = rows.filter((r) => r.topup_amount);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2"><CohortSelect pick={pick} />
        {cohort && <span className="text-sm text-ink/70">{fmtDate(cohort.start_date)} ~ {fmtDate(cohort.end_date)} · {finalized ? "정산 완료" : "미정산"}</span>}
        <Button className="ml-auto" disabled={busy || finalized} onClick={finalize}>{finalized ? "정산 완료됨" : "정산 확정 실행"}</Button></div>
      {msg && <Notice tone={msg.t === "error" ? "error" : "info"}>{msg.s}</Notice>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["success", "partial", "fail", "pending"] as const).map((k) => <Card key={k}><p className="text-sm text-ink/70">{RESULT_LABEL[k]}</p><p className="text-2xl font-bold tabular-nums">{by(k).length}</p></Card>)}
      </div>
      {!finalized && <Notice>정산 전에는 &lsquo;성공 취소&rsquo;로 허위 인증자를 미달 처리할 수 있어요. 정산 후에는 바꿀 수 없어요.</Notice>}
      <Card title="참가자별 결과">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr>{["성명", "인증", "결과", "보증금", ""].map((h) => <th key={h} className="py-1 pr-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-ink/10">{rows.filter((r) => r.participation_status !== "void").map((r) => (
              <tr key={r.user_id}><td className="py-2 pr-3"><b>{r.name}</b> ({r.nickname})</td><td className="pr-3 tabular-nums">{r.checkin_count}</td>
                <td className="pr-3">{RESULT_LABEL[r.result]}{r.revoked && " (성공취소)"}</td><td className="pr-3 tabular-nums">{won(r.deposit_balance)}</td>
                <td>{!finalized && <button className="min-h-11 underline" onClick={() => revoke(r)}>{r.revoked ? "성공취소 해제" : "성공 취소"}</button>}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <Button variant="line" className="mt-2" onClick={() => downloadCsv(`정산_${pick.no}기.csv`, [["성명", "닉네임", "인증횟수", "결과", "보증금잔액"], ...rows.map((r) => [r.name, r.nickname, r.checkin_count, RESULT_LABEL[r.result], r.deposit_balance])])}>CSV</Button>
      </Card>
      <Card title="재납부 대상 (다음 기수)">
        {topups.length === 0 ? <p className="text-sm text-ink/70">없어요.</p> : (
          <ul className="divide-y divide-ink/10 text-sm">{topups.map((r) => <li key={r.user_id} className="flex justify-between py-2"><span>{r.name} ({RESULT_LABEL[r.result]})</span><b>{won(r.topup_amount!)}</b></li>)}</ul>
        )}
      </Card>
    </div>
  );
}
