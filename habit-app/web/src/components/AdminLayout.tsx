import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useAsync } from "../lib/hooks";
import { rpc } from "../lib/supabase";
import { Spinner } from "./ui";

const link = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-lg px-3 min-h-11 inline-flex items-center text-sm font-semibold ${isActive ? "bg-gold text-ink" : "text-ink hover:bg-gold-light"}`;

export default function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  const counts = useAsync(() => rpc<{ claimed_payments: number; refunds_waiting: number }>("admin_counts"), [isAdmin]);
  if (loading) return <Spinner />;
  if (!isAdmin) return <Navigate to="/" replace />; // 실제 차단은 서버(RLS/RPC)에서 한다
  const c = counts.data;
  const badge = (n?: number) => (n ? <span className="ml-1 rounded-full bg-ink px-1.5 text-xs text-paper">{n}</span> : null);
  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2"><b>부행일치 관리자</b><NavLink to="/" className="text-sm underline">참가자 화면</NavLink></div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2">
          <NavLink to="/admin" end className={link}>기수</NavLink>
          <NavLink to="/admin/payments" className={link}>입금 확인{badge(c?.claimed_payments)}</NavLink>
          <NavLink to="/admin/members" className={link}>참가자</NavLink>
          <NavLink to="/admin/settle" className={link}>정산</NavLink>
          <NavLink to="/admin/refunds" className={link}>환급{badge(c?.refunds_waiting)}</NavLink>
          <NavLink to="/admin/import" className={link}>이관</NavLink>
          <NavLink to="/admin/settings" className={link}>설정</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-4"><Outlet context={{ refreshCounts: counts.reload }} /></main>
    </div>
  );
}
