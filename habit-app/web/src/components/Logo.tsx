// 부행일치 심볼: 제공받은 원본 로고에서 심볼만 잘라 배경을 투명하게 처리한 이미지를 그대로 사용한다.
export default function Logo({ size = 32 }: { size?: number }) {
  return <img src={`${import.meta.env.BASE_URL}brand/logo-mark.png`} alt="부행일치" width={size} height={Math.round(size * (460 / 520))} style={{ height: "auto", width: size }} draggable={false} />;
}

export function Wordmark({ size = 18 }: { size?: number }) {
  return <span className="font-extrabold tracking-tight" style={{ fontSize: size }}>부행일치</span>;
}
