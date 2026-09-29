import { useState } from "react";
import { rpc, supabase, type RpcResult } from "../../lib/supabase";
import { useAsync } from "../../lib/hooks";
import type { AdminParticipant, Cohort } from "../../lib/types";
import { Button, Card, Notice, Spinner } from "../../components/ui";
import { MEMBER_STATUS, PART_STATUS, RESULT_LABEL, won } from "../../lib/format";
import { downloadCsv } from "../../lib/csv";

export function useCohortPick() {
  const cohorts = useAsync(async () => ((await supabase.from("cohorts").select("*").order("no", { ascending: false })).data ?? []) as Cohort[]);
  const [sel, setSel] = useState<number | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const def = cohorts.data?.find((c) => c.start_date <= today)?.no ?? cohorts.data?.[0]?.no ?? null;
  return { cohorts, no: sel ?? def, setNo: setSel };
}

export function CohortSelect({ pick }: { pick: ReturnType<typeof useCohortPick> }) {
  return (
    <select className="min-h-11 rounded-lg border border-ink/25 bg-white px-3" value={pick.no ?? ""} onChange={(e) => pick.setNo(Number(e.target.value))}>
      {(pick.cohorts.data ?? []).map((c) => <option key={c.no} value={c.no}>{c.no}기 ({c.start_date})</option>)}
    </select>
  );
}

// A3: 참가자 (상태, 인증 횟수, 잔액, 검색·필터)
export default function Members() {
  const pick = useCohortPick();
  const list = useAsync(async () => (pick.no == null ? [] : await rpc<AdminParticipant[]>("admin_participants", { p_cohort: pick.no })), [pick.no]);
  const [q, setQ] = useState(""); const [st, setSt] = useState(""); const [msg, setMsg] = useState("");
  if (pick.cohorts.loading) return <Spinner />;
  const rows = (list.data ?? []).filter((r) => (!q || `${r.name}${r.nickname}${r.phone}${r.email}`.includes(q)) && (!st || r.participation_status === st));

  const cancel = async (r: AdminParticipant) => {
    if (!confirm(`${r.name}님의 신청을 취소하고 입금액 전액을 환불 처리할까요?\n(실제 송금은 직접 해 주세요)`)) return;
    try {
      const x = await rpc<RpcResult & { refund_amount?: number }>("admin_cancel_application", { p_user: r.user_id, p_cohort: pick.no });
      setMsg(x.ok ? `취소 완료. 환불할 금액: ${won(x.refund_amount ?? 0)}` : x.message ?? "처리하지 못했어요");
      await list.reload();
    } catch (e) { setMsg((e as Error).message); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <CohortSelect pick={pick} />
        <input className="min-h-11 flex-1 rounded-lg border border-ink/25 px-3" placeholder="이름·닉네임·연락처·이메일 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="min-h-11 rounded-lg border border-ink/25 bg-white px-3" value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="">전체 상태</option>{Object.entries(PART_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Button variant="line" onClick={() => downloadCsv(`참가자_${pick.no}기.csv`, [["성명", "닉네임", "연락처", "이메일", "회원상태", "참여상태", "인증횟수", "결과", "보증금잔액", "참가비납부"],
          ...rows.map((r) => [r.name, r.nickname, r.phone, r.email, MEMBER_STATUS[r.membership_status], PART_STATUS[r.participation_status], r.checkin_count, RESULT_LABEL[r.result], r.deposit_balance, r.fee_paid ? "Y" : "N"])])}>CSV</Button>
      </div>
      {msg && <Notice>{msg}</Notice>}
      <p className="text-sm text-ink/70">{rows.length}명</p>
      {list.loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gold-light"><tr>{["성명(닉네임)", "연락처", "참여 상태", "인증", "결과", "보증금", ""].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-ink/10">
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="px-3 py-2"><b>{r.name}</b> ({r.nickname})<br /><span className="text-ink/70">{r.email}</span></td>
                  <td className="px-3 py-2">{r.phone}</td>
                  <td className="px-3 py-2">{PART_STATUS[r.participation_status]}{r.stop_requested && " · 중단신청"}</td>
                  <td className="px-3 py-2 tabular-nums">{r.checkin_count}</td>
                  <td className="px-3 py-2">{RESULT_LABEL[r.result]}{r.revoked && " (성공취소)"}</td>
                  <td className="px-3 py-2 tabular-nums">{won(r.deposit_balance)}</td>
                  <td className="px-3 py-2">{r.participation_status !== "void" && <button className="min-h-11 underline" onClick={() => cancel(r)}>시작 전 취소</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
