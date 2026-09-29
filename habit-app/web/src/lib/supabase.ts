import { createClient } from "@supabase/supabase-js";
import { DEMO, demoClient } from "./demo";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const SUPABASE_URL = url;
export const SUPABASE_KEY = key;

// 세션을 localStorage 에 저장하고 자동 갱신 → 재로그인 빈도를 줄인다.
const real = DEMO ? null : createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "bhic-auth" },
});
export const supabase = (DEMO ? demoClient : real) as NonNullable<typeof real>;

export type RpcResult = { ok: boolean; code?: string; message?: string; [k: string]: unknown };

// 업무 거절은 {ok:false} 로 오고, 권한/네트워크 오류는 예외로 온다.
export async function rpc<T = RpcResult>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message.includes("forbidden") ? "권한이 없습니다" : error.message);
  return data as T;
}
