import { useState } from "react";
import { rpc, supabase, type RpcResult } from "../../lib/supabase";
import { useAsync } from "../../lib/hooks";
import { Button, Card, Notice, Spinner } from "../../components/ui";
import { downloadCsv, parseCsv } from "../../lib/csv";
import { won } from "../../lib/format";
import { useCohortPick, CohortSelect } from "./Members";

type Row = { name: string; nickname: string; phone: string; email: string; deposit_balance: number; fee_paid: boolean };
type Pending = { email: string; name: string; nickname: string; deposit_balance: number; cohort_no: number; linked_at: string | null };

const HEADERS = ["이름", "닉네임", "연락처", "이메일", "보증금잔액", "참가비납부"];
const yes = (s: string) => /^(y|yes|true|1|o|예|납부|완료|ㅇ)$/i.test(s.trim());

// A7: 기존 구글시트 참가자 CSV 일괄 등록. 같은 이메일로 가입하면 자동 연결.
export default function Import() {
  const pick = useCohortPick();
  const pend = useAsync(async () => ((await supabase.from("pending_imports").select("*").order("email")).data ?? []) as Pending[]);
  const [rows, setRows] = useState<Row[]>([]); const [errs, setErrs] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ t: "info" | "error"; s: string } | null>(null); const [busy, setBusy] = useState(false);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const table = parseCsv(await f.text());
    const head = table[0] ?? []; const idx = (n: string) => head.findIndex((h) => h.replace(/\s/g, "") === n);
    const col = Object.fromEntries(HEADERS.map((h) => [h, idx(h)]));
    const missing = HEADERS.filter((h) => col[h] < 0);
    if (missing.length) { setRows([]); setErrs([`헤더가 없어요: ${missing.join(", ")} (첫 줄은 ${HEADERS.join(",")} 형식)`]); return; }
    const out: Row[] = [], bad: string[] = [];
    table.slice(1).forEach((r, i) => {
      const email = (r[col["이메일"]] ?? "").toLowerCase(), bal = Number((r[col["보증금잔액"]] ?? "0").replace(/[^\d]/g, "")) || 0;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { bad.push(`${i + 2}행: 이메일 형식 오류 (${email || "빈칸"})`); return; }
      if (bal > 20000) { bad.push(`${i + 2}행: 보증금 잔액이 2만원을 넘어요 (${bal})`); return; }
      out.push({ name: r[col["이름"]], nickname: r[col["닉네임"]] || r[col["이름"]], phone: r[col["연락처"]] ?? "", email, deposit_balance: bal, fee_paid: yes(r[col["참가비납부"]] ?? "") });
    });
    const dup = out.map((x) => x.email).filter((e, i, a) => a.indexOf(e) !== i);
    if (dup.length) bad.push(`중복 이메일: ${[...new Set(dup)].join(", ")}`);
    setRows(out); setErrs(bad); setMsg(null);
  };

  const submit = async () => {
    if (pick.no == null) return;
    setBusy(true); setMsg(null);
    try {
      const r = await rpc<RpcResult & { rows?: number; linked_now?: number }>("admin_import_members", { p_rows: rows.map((x) => ({ ...x, cohort_no: pick.no })) });
      setMsg(r.ok ? { t: "info", s: `${r.rows}명 등록 완료 (이미 가입한 ${r.linked_now}명은 바로 연결됨)` } : { t: "error", s: r.message ?? "등록하지 못했어요" });
      if (r.ok) { setRows([]); await pend.reload(); }
    } catch (e) { setMsg({ t: "error", s: (e as Error).message }); } finally { setBusy(false); }
  };

  if (pick.cohorts.loading || pend.loading) return <Spinner />;
  return (
    <div className="space-y-3">
      <Card title="기존 참가자 CSV 이관">
        <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm">
          <li>구글시트에서 아래 6개 열로 정리해 CSV로 내려받아요. (파일 → 다운로드 → CSV)</li>
          <li>이관할 기수를 고르고 파일을 올려요. (예: 40기)</li>
          <li>참가자에게 <b>시트에 적힌 이메일 그대로</b> 가입하라고 안내하면 신청·입금 없이 바로 연결돼요.</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="line" onClick={() => downloadCsv("이관_양식.csv", [HEADERS, ["홍길동", "길동", "010-1234-5678", "gildong@example.com", 20000, "Y"]])}>양식 받기</Button>
          <CohortSelect pick={pick} />
          <input type="file" accept=".csv,text/csv" className="min-h-11" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </Card>
      {errs.length > 0 && <Notice tone="error">{errs.map((e, i) => <span key={i}>{e}<br /></span>)}</Notice>}
      {rows.length > 0 && (
        <Card title={`미리보기 (${rows.length}명)`}>
          <div className="max-h-72 overflow-auto"><table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr>{["이름", "닉네임", "연락처", "이메일", "보증금", "참가비"].map((h) => <th key={h} className="py-1 pr-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-ink/10">{rows.map((r) => <tr key={r.email}><td className="py-1 pr-3">{r.name}</td><td className="pr-3">{r.nickname}</td><td className="pr-3">{r.phone}</td><td className="pr-3">{r.email}</td><td className="pr-3">{won(r.deposit_balance)}</td><td>{r.fee_paid ? "납부" : "미납"}</td></tr>)}</tbody></table></div>
          <Button className="mt-3" disabled={busy || errs.length > 0} onClick={submit}>{pick.no}기로 {rows.length}명 등록</Button>
        </Card>
      )}
      {msg && <Notice tone={msg.t === "error" ? "error" : "info"}>{msg.s}</Notice>}
      <Card title={`이관 현황 (${(pend.data ?? []).filter((p) => p.linked_at).length}/${pend.data?.length ?? 0} 연결됨)`}>
        <ul className="divide-y divide-ink/10 text-sm">
          {(pend.data ?? []).map((p) => <li key={p.email} className="flex justify-between py-2"><span>{p.name} · {p.email} · {p.cohort_no}기 · {won(p.deposit_balance)}</span><b>{p.linked_at ? "연결됨" : "가입 대기"}</b></li>)}
        </ul>
      </Card>
    </div>
  );
}
