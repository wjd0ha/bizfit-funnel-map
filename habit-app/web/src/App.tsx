import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import MemberLayout from "./components/MemberLayout";
import AdminLayout from "./components/AdminLayout";
import { Spinner } from "./components/ui";
import Login from "./pages/Login";
import Legal from "./pages/Legal";
import Home from "./pages/Home";
import Apply from "./pages/Apply";
import Habits from "./pages/Habits";
import Progress from "./pages/Progress";
import Result from "./pages/Result";
import My from "./pages/My";
import Stop from "./pages/Stop";
import Refund from "./pages/Refund";
import Cohorts from "./pages/admin/Cohorts";
import Payments from "./pages/admin/Payments";
import Members from "./pages/admin/Members";
import Settle from "./pages/admin/Settle";
import Refunds from "./pages/admin/Refunds";
import Import from "./pages/admin/Import";
import Settings from "./pages/admin/Settings";

function Gate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Spinner />;
  return session ? <>{children}</> : <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* S11: 로그인 없이 열람 */}
          <Route path="/terms" element={<Legal kind="terms" />} />
          <Route path="/privacy" element={<Legal kind="privacy" />} />
          <Route element={<Gate><MemberLayout /></Gate>}>
            <Route path="/" element={<Home />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/result" element={<Result />} />
            <Route path="/my" element={<My />} />
            <Route path="/stop" element={<Stop />} />
            <Route path="/refund" element={<Refund />} />
          </Route>
          <Route path="/admin" element={<Gate><AdminLayout /></Gate>}>
            <Route index element={<Cohorts />} />
            <Route path="payments" element={<Payments />} />
            <Route path="members" element={<Members />} />
            <Route path="settle" element={<Settle />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="import" element={<Import />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
