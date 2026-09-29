import { useState } from "react";
import { rpc, supabase, type RpcResult } from "../../lib/supabase";
import { useAsync } from "../../lib/hooks";
import { Button, Card, Field, Notice, Spinner, copyText } from "../../components/ui";

// 설정값은 코드/저장소에 넣지 않고 여기(DB)에서만 관리한다.
const GROUPS: { title: string; keys: [string, string, string?][] }[] = [
  { title: "입금 계좌", keys: [["bank_name", "은행"], ["bank_account", "계좌번호"], ["bank_holder", "예금주"]] },
  { title: "단톡방 (입금 확인된 참가자에게만 노출)", keys: [["chat_url", "오픈채팅 링크"], ["chat_password", "비밀번호"]] },
  { title: "운영자 정보 (참여 규정·처리방침에 표시)", keys: [["operator_name", "운영자 이름"], ["operator_contact_email", "문의 이메일"]] },
  { title: "금액", keys: [["fee_amount", "참가비(원)", "number"], ["deposit_amount", "보증금(원)", "number"], ["partial_forfeit", "부분환급 차감액(원)", "number"]] },
  { title: "시간·기한", keys: [["checkin_start", "인증 시작(HH:MM)"], ["checkin_end", "인증 종료(HH:MM)"], ["topup_grace_days", "재납부 유예일(다음 기수 시작일 +N일)", "number"], ["refund_claim_days", "환급 신청 가능일", "number"], ["stop_from_day", "중단 신청 시작 일차", "number"], ["chat_open_days_before", "단톡방 공개(시작 N일 전)", "number"]] },
  { title: "판정 기준", keys: [["success_min", "성공 최소 인증 횟수", "number"], ["partial_min", "부분환급 최소 인증 횟수", "number"]] },
  { title: "버전", keys: [["terms_version", "참여 규정 버전"], ["privacy_version", "개인정보 처리방침 버전"]] },
];

// A6: 설정
export default function Settings() {
  const st = useAsync(async () => Object.fromEntries(((await supabase.from("settings").select("*")).data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])) as Record<string, string>);
  const [edit, setEdit] = useState<Record<string, string>>({}); const [msg, setMsg] = useState<{ t: "info" | "error"; s: string } | null>(null);
  const [token, setToken] = useState("");
  if (st.loading) return <Spinner />;
  const cur = st.data ?? {}; const val = (k: string) => edit[k] ?? cur[k] ?? "";
  const dirty = Object.keys(edit).filter((k) => edit[k] !== cur[k]);

  const save = async () => {
    setMsg(null);
    try {
      for (const k of dirty) { const r = await rpc<RpcResult>("admin_set_setting", { p_key: k, p_value: edit[k] }); if (!r.ok) throw new Error(r.message); }
      setEdit({}); await st.reload(); setMsg({ t: "info", s: `${dirty.length}개 저장했어요` });
    } catch (e) { setMsg({ t: "error", s: (e as Error).message }); }
  };
  const makeToken = async () => {
    if (!confirm("새 토큰을 만들면 기존 시트 연동 토큰은 더 이상 동작하지 않아요. 계속할까요?")) return;
    const t = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
    try {
      const r = await rpc<RpcResult>("admin_set_export_token", { p_token: t });
      if (!r.ok) throw new Error(r.message); setToken(t); await st.reload();
    } catch (e) { setMsg({ t: "error", s: (e as Error).message }); }
  };

  return (
    <div className="space-y-3">
      {msg && <Notice tone={msg.t === "error" ? "error" : "info"}>{msg.s}</Notice>}
      {GROUPS.map((g) => (
        <Card key={g.title} title={g.title}>
          <div className="grid gap-3 sm:grid-cols-2">{g.keys.map(([k, label, type]) => <Field key={k} label={label} type={type ?? "text"} value={val(k)} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />)}</div>
        </Card>
      ))}
      <Card title="자동 정산">
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[#B8892B]" checked={val("auto_finalize") === "on"} onChange={(e) => setEdit({ ...edit, auto_finalize: e.target.checked ? "on" : "off" })} />
          <span>기수 종료 다음 날 00:10에 자동 정산 (기본 꺼짐 — 허위 인증을 검토한 뒤 정산 화면에서 수동 실행 권장)</span></label>
      </Card>
      <div className="sticky bottom-0 bg-paper py-2"><Button disabled={dirty.length === 0} onClick={save}>변경사항 저장 ({dirty.length})</Button></div>
      <Card title="구글 시트 연동 토큰">
        <p className="mb-2 text-sm text-ink/70">서버에는 해시만 저장돼요. 토큰은 만든 직후 한 번만 보여요. Apps Script의 스크립트 속성에 붙여 넣으세요.</p>
        <p className="mb-2 text-sm">현재 상태: <b>{cur.export_token_hash ? "설정됨" : "미설정"}</b></p>
        <Button variant="line" onClick={makeToken}>새 토큰 발급</Button>
        {token && <div className="mt-3 rounded-lg bg-gold-light p-3"><code className="break-all">{token}</code><div className="mt-2"><Button variant="line" onClick={() => copyText(token)}>복사</Button></div></div>}
      </Card>
    </div>
  );
}
