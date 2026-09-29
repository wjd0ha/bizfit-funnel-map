// 원형 게이지. percent 는 0~100 로 고정(넘어도 100% 표시), 횟수는 별도로 계속 누적 표시.
export default function Gauge({ percent, count, goal }: { percent: number; count: number; goal: number }) {
  const r = 86, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative mx-auto h-60 w-60" role="img" aria-label={`달성률 ${p}%, 인증 ${count}회 / 목표 ${goal}회`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#EFE3C2" strokeWidth="13" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="#B8892B" strokeWidth="13" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[64px] font-extrabold leading-none tracking-tight tabular-nums">{p}<span className="ml-0.5 text-2xl font-bold">%</span></span>
        <span className="mt-2 rounded-full bg-ink/[0.06] px-3 py-1 text-sm font-bold tabular-nums">{count} / {goal}회</span>
      </div>
    </div>
  );
}
