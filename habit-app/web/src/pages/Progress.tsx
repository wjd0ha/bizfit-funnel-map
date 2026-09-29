import { rpc } from "../lib/supabase";
import { useAsync } from "../lib/hooks";
import type { Home } from "../lib/types";
import { Card, Notice, Spinner } from "../components/ui";
import { parseDate } from "../lib/format";

type Prog = { start_date: string; count: number; remaining_to_goal: number; success_min: number; partial_min: number; dates: string[] };

// S6: 28일 달력에 인증일 체크 + 18/20회 기준선
export default function Progress() {
  const st = useAsync(async () => {
    const h = await rpc<Home>("get_home");
    if (!h.cohort_no || h.phase === "before_start") return { h, p: null as Prog | null };
    return { h, p: await rpc<Prog>("get_progress", { p_cohort_no: h.cohort_no }) };
  });
  if (st.loading) return <Spinner />;
  const s = st.data;
  if (!s?.p) return <Notice>기수가 시작되면 인증 현황이 나타나요.</Notice>;
  const { p, h } = s;
  const start = parseDate(p.start_date), done = new Set(p.dates);
  const cells = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { i, iso, day: d.getDate(), on: done.has(iso), past: (h.day_no ?? 0) > i, today: (h.day_no ?? 0) === i + 1 };
  });
  const rate = Math.round(Math.min(p.count / p.success_min, 1) * 100), partialPct = Math.round((p.partial_min / p.success_min) * 100);
  return (
    <div className="space-y-3">
      <Card title={`${h.cohort_no}기 진행 현황`}>
        <p className="text-5xl font-extrabold tracking-tight tabular-nums">{rate}<span className="text-2xl font-bold">%</span></p>
        <p className="mt-1 text-sm text-ink/70">{p.count}회 인증 · {p.remaining_to_goal > 0 ? `성공까지 ${p.remaining_to_goal}회 남았어요` : "목표 달성! 계속 쌓아 보세요"}</p>
        <div className="relative mb-9 mt-9 h-3 rounded-full bg-gold-light" aria-hidden>
          <div className="h-3 rounded-full bg-gold" style={{ width: `${rate}%` }} />
          {/* 기준선: 부분환급(약 90%) / 성공(100%). 라벨이 겹치지 않게 100%는 선 왼쪽으로 붙인다 */}
          {[[partialPct, "부분환급", "below"], [100, "성공", "above"]].map(([n, label, where]) => (
            <div key={n as number} className="absolute -top-2 h-7 border-l-2 border-ink" style={{ left: `${n}%`, marginLeft: n === 100 ? -2 : 0 }}>
              <span className={`absolute right-1.5 whitespace-nowrap text-xs font-bold ${where === "above" ? "-top-6" : "top-8"}`}>{n}% <span className="font-normal text-ink/70">{label}</span></span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="인증 달력">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink/70 mb-1">{["월", "화", "수", "목", "금", "토", "일"].map((x) => <span key={x}>{x}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c) => (
            <div key={c.i} aria-label={`${c.iso} ${c.on ? "인증함" : "미인증"}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-xs ${c.on ? "bg-gold text-ink font-bold" : c.past ? "bg-ink/[0.06] text-ink/60" : "bg-white ring-1 ring-ink/10"} ${c.today ? "ring-2 !ring-ink" : ""}`}>
              <span>{c.day}</span>{c.on && <span aria-hidden>✓</span>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
