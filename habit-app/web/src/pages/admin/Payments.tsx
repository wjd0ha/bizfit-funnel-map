import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { rpc, supabase, type RpcResult } from "../../lib/supabase";
import { useAsync } from "../../lib/hooks";
import type { Payment } from "../../lib/types";
import { Button, Card, Notice, Spinner } from "../../components/ui";
import { KIND_LABEL, PAY_STATUS, fmtKst, won } from "../../lib/format";

type Row = Payment & { profiles: { name: string; nickname: string } | null };

// A2: 입금 확인 — "입금했어요" 표시된 건을 확인/반려
export default function Payments() {
  const { refreshCounts } = useOutletContext<{ refreshCounts: () => void }>();
  const [filter, setFilter] = useState<"claimed" | "awaiting" | "all">("claimed");
  const list = useAsync(async () => {
    let q = supabase.from("payments").select("*, profiles(name,nickname)").order("id", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    return ((await q).data ?? []) as Row[];
  }, [filter]);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState<number | null>(null);

  const act = async (id: number, fn: "admin_confirm_payment" | "admin_reject_payment") => {
    setBusy(id); setMsg("");
    try {
      const r = await rpc<RpcResult>(fn, { p_payment_id: id });
      if (!r.ok) setMsg(r.message ?? "처리하지 못했어요");
      await list.reload(); refreshCounts();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {([["claimed", "확인 대기"], ["awaiting", "입금 전"], ["all", "전체"]] as const).map(([k, l]) => (
          <Button key={k} variant={filter === k ? "primary" : "line"} onClick={() => setFilter(k)}>{l}</Button>
        ))}
      </div>
      {msg && <Notice tone="error">{msg}</Notice>}
      {list.loading ? <Spinner /> : (list.data ?? []).length === 0 ? <Card><p className="text-sm text-ink/60">해당하는 입금 내역이 없어요.</p></Card> : (
        <div className="space-y-2">
          {list.data!.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b>{p.profiles?.name}</b> <span className="text-sm text-ink/60">({p.profiles?.nickname})</span><br />
                  <span className="text-sm">입금자명 <b>{p.depositor_name ?? "-"}</b> · {p.cohort_no}기 · {KIND_LABEL[p.kind]}</span><br />
                  <span className="text-sm text-ink/60">{PAY_STATUS[p.status]} · {fmtKst(p.created_at)}</span>
                </div>
                <div className="text-right"><p className="text-lg font-bold tabular-nums">{won(p.amount)}</p>
                  {(p.status === "claimed" || p.status === "awaiting") && (
                    <div className="mt-1 flex gap-2">
                      <Button disabled={busy === p.id} onClick={() => act(p.id, "admin_confirm_payment")}>확인</Button>
                      <Button variant="danger" disabled={busy === p.id} onClick={() => act(p.id, "admin_reject_payment")}>반려</Button>
                    </div>)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
