import { useCallback, useEffect, useState } from "react";

// 비동기 로더: { data, error, loading, reload }
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    try { setError(null); setData(await fn()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { data, error, loading, reload: run };
}

export function useInterval(fn: () => void, ms: number) {
  useEffect(() => {
    const id = setInterval(fn, ms);
    const onVis = () => { if (document.visibilityState === "visible") fn(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms]);
}
