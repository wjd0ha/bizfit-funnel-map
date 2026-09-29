// 원형 게이지. percent 는 0~100 로 고정(넘어도 100% 표시), 횟수는 별도로 계속 누적 표시.
export default function Gauge({ percent, count, goal }: { percent: number; count: number; goal: number }) {
  const r = 84, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative mx-auto h-56 w-56" role="img" aria-label={`달성률 ${p}%, 인증 ${count}회 / 목표 ${goal}회`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#EFE3C2" strokeWidth="16" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="#B8892B" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums">{p}<span className="text-2xl">%</span></span>
        <span className="mt-1 text-lg font-semibold tabular-nums">{count} / {goal}회</span>
      </div>
    </div>
  );
}
