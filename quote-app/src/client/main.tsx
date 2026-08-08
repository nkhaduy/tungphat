import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { AppShell } from "./components/AppShell";
import { AdminAuditPage } from "./pages/AdminAuditPage";
import { AdminBranchesPage } from "./pages/AdminBranchesPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { LoginPage } from "./pages/LoginPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { QuoteEditorPage } from "./pages/QuoteEditorPage";
import { QuoteListPage } from "./pages/QuoteListPage";
import { QuotePreviewPage } from "./pages/QuotePreviewPage";
import "./styles.css";

function Protected({ children, admin = false, allowPasswordChange = false }: { children: ReactNode; admin?: boolean; allowPasswordChange?: boolean }) {
  const { loading, user } = useAuth();
  if (loading) return <div className="app-loading"><img src="/logo-horizontal.png" alt="Tùng Phát" /><span /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword && !allowPasswordChange) return <Navigate to="/doi-mat-khau" replace />;
  if (admin && user.role !== "ADMIN") return <Navigate to="/bao-gia" replace />;
  return children;
}

function HomeRedirect() {
  const { loading, user } = useAuth();
  if (loading) return <div className="app-loading"><span /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/doi-mat-khau" replace />;
  return <Navigate to={user.role === "ADMIN" ? "/admin" : "/bao-gia"} replace />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/doi-mat-khau" element={<Protected allowPasswordChange><ChangePasswordPage /></Protected>} />
          <Route path="/" element={<HomeRedirect />} />
          <Route element={<Protected><AppShell /></Protected>}>
            <Route path="/bao-gia" element={<QuoteListPage />} />
            <Route path="/bao-gia/moi" element={<QuoteEditorPage />} />
            <Route path="/bao-gia/:id" element={<QuotePreviewPage />} />
            <Route path="/bao-gia/:id/chinh-sua" element={<QuoteEditorPage />} />
            <Route path="/bao-gia/:id/xem-truoc" element={<QuotePreviewPage />} />
          </Route>
          <Route element={<Protected admin><AppShell /></Protected>}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/bao-gia" element={<QuoteListPage admin />} />
            <Route path="/admin/bao-gia/:id" element={<QuotePreviewPage admin />} />
            <Route path="/admin/nhan-vien" element={<AdminUsersPage />} />
            <Route path="/admin/chi-nhanh" element={<AdminBranchesPage />} />
            <Route path="/admin/cai-dat" element={<AdminSettingsPage />} />
            <Route path="/admin/lich-su" element={<AdminAuditPage />} />
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
