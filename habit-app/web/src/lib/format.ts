export const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

// "YYYY-MM-DD" → 로컬 자정 Date (타임존 밀림 방지)
export const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const fmtDate = (s: string | null | undefined) => {
  if (!s) return "-";
  const d = parseDate(s.slice(0, 10));
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}(${DOW[d.getDay()]})`;
};
// timestamptz → 한국시간 표시
export const fmtKst = (iso: string | null | undefined) => {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
};
export const RESULT_LABEL: Record<string, string> = { pending: "진행 중", success: "성공", partial: "부분환급", fail: "미달" };
export const PAY_STATUS: Record<string, string> = { awaiting: "입금 전", claimed: "확인 대기", confirmed: "확인 완료", rejected: "반려" };
export const KIND_LABEL: Record<string, string> = { initial: "신청(참가비+보증금)", topup: "보증금 재납부" };
export const MEMBER_STATUS: Record<string, string> = { applied: "신청", active: "참가 중", ended: "종료" };
export const PART_STATUS: Record<string, string> = {
  pending_payment: "입금 대기", topup_pending: "재납부 대기", active: "참가 중", void: "무효",
};
