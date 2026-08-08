import { useState, type ReactNode } from "react";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import type { AdminUser } from "../api";
import { NavIcon } from "./NavIcon";

const nav = [
  ["dashboard", "Tổng quan"], ["products", "Sản phẩm"], ["articles", "Bài viết"], ["projects", "Dự án"], ["pages", "Trang"],
  ["media", "Media"], ["business-settings", "Cài đặt"], ["users", "Người dùng"], ["versions", "Phiên bản"], ["audit", "Nhật ký"],
] as const;

const roleLabels: Record<AdminUser["role"], string> = { "super-admin": "Quản trị viên", admin: "Quản trị viên", editor: "Biên tập viên" };

export function Layout({ user, route, onRoute, onLogout, children }: { user: AdminUser; route: string; onRoute: (route: string) => void; onLogout: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="app-shell">
    <aside id="admin-sidebar" className={open ? "sidebar is-open" : "sidebar"} aria-label="Điều hướng quản trị">
      <div className="brand-lockup"><img src="/logo-horizontal.png" alt="Tùng Phát" /><span>LIGHT CMS TÙNG PHÁT</span></div>
      <nav aria-label="Điều hướng chính">{nav.map(([key, label]) => <button key={key} type="button" aria-label={label} className={route === key ? "nav-link active" : "nav-link"} onClick={() => { onRoute(key); setOpen(false); }}><NavIcon route={key} /><span>{label}</span></button>)}</nav>
      <div className="sidebar-user"><div className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</div><div><strong>{user.name}</strong><span>{roleLabels[user.role]}</span></div><button type="button" className="icon-button" onClick={onLogout} aria-label="Đăng xuất"><LogOut size={18} /></button></div>
    </aside>
    {open ? <button type="button" className="sidebar-backdrop" aria-label="Đóng menu" onClick={() => setOpen(false)} /> : null}
    <div className="workspace">
      <header className="topbar"><div className="topbar-title"><Building2 size={18} /><span>Quản trị nội dung website</span></div><div className="topbar-account"><strong>{user.name}</strong><span className="role-chip">{roleLabels[user.role]}</span><button type="button" className="topbar-logout" onClick={onLogout}><LogOut size={16} /> Đăng xuất</button></div><button type="button" className="menu-button" aria-label={open ? "Đóng menu" : "Mở menu"} aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen((value) => !value)}>{open ? <X size={20} /> : <Menu size={20} />}</button></header>
      <main id="main-content" className="main-content" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
