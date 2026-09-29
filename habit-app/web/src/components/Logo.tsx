// 겹친 두 원(목표와 행동의 일치) + 체크. 골드 단색.
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="부행일치">
      <g fill="none" stroke="#B8892B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="26" cy="32" r="16" /><circle cx="38" cy="32" r="16" /><path d="M25 33l6 6 10-13" />
      </g>
    </svg>
  );
}
