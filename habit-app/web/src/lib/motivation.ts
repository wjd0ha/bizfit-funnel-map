import type { Home } from "./types";

// 주차/진행도에 따른 동기부여 문구. 죄책감을 주지 않는 부드러운 톤.
export function motivation(h: Home): { head: string; sub: string } {
  const goal = h.goal ?? 20, count = h.count ?? 0, d = h.day_no ?? 0;
  if (h.phase === "before_start") return { head: "곧 시작해요", sub: "첫걸음이 절반이에요. 습관만 정해 두면 준비 끝!" };
  const remain = Math.max(goal - count, 0), left = (h.days_left ?? 0) + (h.checked_today ? 0 : 1);
  if (count >= goal) return { head: "목표 달성! 이제 습관이에요", sub: "남은 날은 덤이에요. 계속 쌓아 볼까요?" };
  if (d === 14) return { head: "오늘이 딱 절반이에요", sub: "여기까지 온 것만으로 대단해요" };
  const week = Math.min(4, Math.max(1, Math.ceil(d / 7)));
  if (week >= 3 && remain > left) return { head: "끝까지 가는 게 이기는 거예요", sub: "이번 기수는 빠듯하지만, 오늘의 한 번이 다음 기수의 힘이 돼요" };
  if (week === 1) return { head: "시작이 절반이에요", sub: "첫 주만 넘기면 훨씬 쉬워져요" };
  if (week === 2) return { head: "이제 곧 절반이에요", sub: "흐름을 탔어요. 이 리듬 그대로 가요" };
  if (week === 3) return { head: "절반을 넘었어요", sub: `가장 흔들리기 쉬운 주예요. 성공까지 ${remain}번 남았어요` };
  return { head: "결승선이 보여요", sub: `성공까지 ${remain}번! 끝까지 가면 습관이 내 것이 돼요` };
}
