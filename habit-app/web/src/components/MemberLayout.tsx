import { NavLink, Outlet } from "react-router-dom";
import Logo, { Wordmark } from "./Logo";
import InAppBanner from "./InAppBanner";
import { useAuth } from "../lib/auth";

const tab = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 flex-1 items-center justify-center rounded-full text-[15px] transition-colors ${isActive ? "bg-white font-bold text-ink ring-1 ring-ink/10" : "font-semibold text-ink/70"}`;

export default function MemberLayout() {
  const { isAdmin } = useAuth();
  return (
    <div className="min-h-screen">
      <InAppBanner />
      <header className="mx-auto max-w-md px-5 pt-4">
        <div className="flex items-center gap-2"><Logo size={28} /><Wordmark size={19} />
          {isAdmin && <NavLink to="/admin" className="ml-auto rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-paper">관리자</NavLink>}</div>
        <nav className="mt-4 flex gap-1 rounded-full bg-ink/[0.06] p-1">
          <NavLink to="/" end className={tab}>홈</NavLink><NavLink to="/progress" className={tab}>진행 현황</NavLink><NavLink to="/my" className={tab}>마이</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-md px-5 pb-40 pt-6"><Outlet /></main>
    </div>
  );
}
