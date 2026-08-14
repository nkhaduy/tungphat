import { Building2, FileClock, FilePlus2, Files, LayoutDashboard, LogOut, Settings, Store, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

const employeeLinks = [
  { to: "/bao-gia", label: "Báo giá của tôi", icon: Files, end: false },
  { to: "/bao-gia/moi", label: "Tạo báo giá", icon: FilePlus2, end: false },
];

const adminLinks = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/bao-gia", label: "Tất cả báo giá", icon: FileClock },
  { to: "/admin/nhan-vien", label: "Nhân viên", icon: Users },
  { to: "/admin/chi-nhanh", label: "Chi nhánh", icon: Store },
  { to: "/admin/cai-dat", label: "Cài đặt", icon: Settings },
];

export function AppShell() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const links = user.role === "ADMIN" ? adminLinks : employeeLinks;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href={user.role === "ADMIN" ? "/admin" : "/bao-gia"}>
          <img src="/logo-horizontal.png" alt="Tùng Phát" />
          <span>BÁO GIÁ TÙNG PHÁT</span>
        </a>
        <nav aria-label="Điều hướng chính">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        {user.role === "ADMIN" && (
          <NavLink to="/bao-gia/moi" className="sidebar-create"><FilePlus2 size={18} /> Tạo báo giá</NavLink>
        )}
        <div className="sidebar-user">
          <div className="avatar">{user.fullName.slice(0, 1).toUpperCase()}</div>
          <div><strong>{user.fullName}</strong><span>{user.branchName ?? "Quản trị hệ thống"}</span></div>
          <button type="button" className="icon-button" onClick={() => void signOut()} aria-label="Đăng xuất"><LogOut size={18} /></button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title"><Building2 size={18} /><span>{user.branchName ?? "Toàn hệ thống"}</span></div>
          <div><strong>{user.fullName}</strong><span className="role-chip">{user.role === "ADMIN" ? "Admin" : "Nhân viên"}</span><button type="button" className="topbar-logout" onClick={() => void signOut()}><LogOut size={16} /> Đăng xuất</button></div>
        </header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
