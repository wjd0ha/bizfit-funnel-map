// 부행일치 심볼: 둥근 사각형(목표) + 그 밖으로 뻗는 체크(행동). 골드 단색.
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="부행일치" fill="none" stroke="#B8892B" strokeWidth="7">
      <path d="M35 13H21a8 8 0 0 0-8 8v22a8 8 0 0 0 8 8h22a8 8 0 0 0 8-8V33" strokeLinecap="butt" />
      <path d="M22 34l10 11L56 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ size = 18 }: { size?: number }) {
  return <span className="font-extrabold tracking-tight" style={{ fontSize: size }}>부행일치</span>;
}
