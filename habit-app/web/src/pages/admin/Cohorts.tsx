import { useEffect, useState } from "react";
import { rpc, supabase, type RpcResult } from "../../lib/supabase";
import { useAsync } from "../../lib/hooks";
import type { Cohort } from "../../lib/types";
import { Button, Card, Field, Notice, Spinner } from "../../components/ui";
import { fmtDate, fmtKst, parseDate } from "../../lib/format";

const pad = (n: number) => String(n).padStart(2, "0");
const addDays = (s: string, n: number) => { const d = parseDate(s); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
// timestamptz → datetime-local(KST) / 반대로 KST 입력 → ISO
const toKstInput = (iso: string | null) => {
  if (!iso) return "";
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
};
const fromKstInput = (v: string) => (v ? `${v}:00+09:00` : null);

// A1: 기수 관리 (생성 + 날짜 자동 제안 + 모집 활성화)
export default function Cohorts() {
  const list = useAsync(async () => ((await supabase.from("cohorts").select("*").order("no", { ascending: false })).data ?? []) as Cohort[]);
  const [f, setF] = useState({ no: "", start: "", deadline: "" });
  const [msg, setMsg] = useState<{ t: "info" | "error"; s: string } | null>(null);

  useEffect(() => {
    rpc<RpcResult & { no?: number; start_date?: string }>("admin_suggest_next_cohort").then((r) => {
      if (r.ok && r.no && r.start_date) setF({ no: String(r.no), start: r.start_date, deadline: `${addDays(r.start_date, -1)}T23:59` });
    }).catch(() => undefined);
  }, [list.data?.length]);

  const act = async (fn: string, args: Record<string, unknown>, okMsg: string) => {
    setMsg(null);
    try {
      const r = await rpc<RpcResult>(fn, args);
      if (!r.ok) setMsg({ t: "error", s: r.message ?? "처리하지 못했어요" }); else { setMsg({ t: "info", s: okMsg }); await list.reload(); }
    } catch (e) { setMsg({ t: "error", s: (e as Error).message }); }
  };

  if (list.loading) return <Spinner />;
  return (
    <div className="space-y-4">
      {msg && <Notice tone={msg.t === "error" ? "error" : "info"}>{msg.s}</Notice>}
      <Card title="기수 생성">
        <p className="mb-2 text-sm text-ink/70">3개 기수 진행 후 1주 휴식 규칙으로 날짜를 제안해요. 확인 후 생성하세요. (월요일 시작, 28일)</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="기수 번호" type="number" value={f.no} onChange={(e) => setF({ ...f, no: e.target.value })} />
          <Field label="시작일(월)" type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} hint={f.start ? `종료일 ${fmtDate(addDays(f.start, 27))}` : ""} />
          <Field label="신청 마감(KST)" type="datetime-local" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
        </div>
        <Button className="mt-3" disabled={!f.no || !f.start}
          onClick={() => act("admin_create_cohort", { p_no: Number(f.no), p_start: f.start, p_end: addDays(f.start, 27), p_apply_deadline: fromKstInput(f.deadline) }, "기수를 만들었어요")}>기수 생성</Button>
      </Card>
      <Card title="기수 목록">
        {(list.data ?? []).length === 0 ? <p className="text-sm text-ink/60">기수가 없어요. 위에서 첫 기수를 만드세요.</p> : (
          <div className="divide-y divide-ink/10">
            {list.data!.map((c) => <CohortRow key={c.no} c={c} act={act} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

function CohortRow({ c, act }: { c: Cohort; act: (fn: string, a: Record<string, unknown>, m: string) => Promise<void> }) {
  const [dl, setDl] = useState(toKstInput(c.apply_deadline));
  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-40"><b>{c.no}기</b><br /><span className="text-sm text-ink/70">{fmtDate(c.start_date)} ~ {fmtDate(c.end_date)}</span>
        {c.finalized_at && <><br /><span className="text-sm">정산 완료 {fmtKst(c.finalized_at)}</span></>}</div>
      <label className="text-sm">마감(KST)<input type="datetime-local" className="ml-2 min-h-11 rounded-lg border border-ink/25 px-2" value={dl} onChange={(e) => setDl(e.target.value)} /></label>
      <Button variant={c.recruiting_open ? "danger" : "primary"}
        onClick={() => act("admin_set_recruiting", { p_no: c.no, p_open: !c.recruiting_open, p_deadline: fromKstInput(dl) }, c.recruiting_open ? "모집을 닫았어요" : "모집을 열었어요")}>
        {c.recruiting_open ? "모집 닫기" : "모집 활성화"}</Button>
      {c.recruiting_open && <span className="rounded-full bg-gold px-2 py-0.5 text-sm font-semibold">모집 중</span>}
    </div>
  );
}
