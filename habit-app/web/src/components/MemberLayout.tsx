import { NavLink, Outlet } from "react-router-dom";
import Logo from "./Logo";
import InAppBanner from "./InAppBanner";
import { useAuth } from "../lib/auth";

const tab = ({ isActive }: { isActive: boolean }) =>
  `min-h-11 flex-1 inline-flex items-center justify-center border-b-2 text-sm font-semibold ${isActive ? "border-gold text-ink" : "border-transparent text-ink/70"}`;

export default function MemberLayout() {
  const { isAdmin } = useAuth();
  return (
    <div className="min-h-screen">
      <InAppBanner />
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 pt-2"><Logo size={26} /><b>부행일치</b>
          {isAdmin && <NavLink to="/admin" className="ml-auto text-sm underline">관리자</NavLink>}</div>
        <nav className="mx-auto flex max-w-md px-2"><NavLink to="/" end className={tab}>홈</NavLink><NavLink to="/progress" className={tab}>진행 현황</NavLink><NavLink to="/my" className={tab}>마이</NavLink></nav>
      </header>
      <main className="mx-auto max-w-md px-4 pb-40 pt-4"><Outlet /></main>
    </div>
  );
}
