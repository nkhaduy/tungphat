import { useState, type ReactNode } from "react";
import type { AdminUser } from "../api";
import { lightCmsUiCopy } from "../environment";

const nav = [
  ["dashboard", "Tổng quan"], ["products", "Sản phẩm"], ["articles", "Bài viết"], ["projects", "Dự án"], ["pages", "Trang"],
  ["media", "Thư viện"], ["business-settings", "Thông tin doanh nghiệp"], ["seo-defaults", "SEO mặc định"], ["users", "Người dùng"], ["audit", "Nhật ký"],
] as const;

export function Layout({ user, route, onRoute, onLogout, children }: { user: AdminUser; route: string; onRoute: (route: string) => void; onLogout: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="admin-shell">
    <aside id="admin-sidebar" className={open ? "sidebar is-open" : "sidebar"} aria-label="Điều hướng quản trị">
      <div className="brand"><span className="brand-mark" aria-hidden="true">TP</span><span><strong>Tùng Phát</strong><small>{lightCmsUiCopy.brandSubtitle}</small></span></div>
      <nav>{nav.map(([key, label]) => <button key={key} className={route === key ? "nav-link active" : "nav-link"} onClick={() => { onRoute(key); setOpen(false); }}>{label}</button>)}</nav>
      <div className="sidebar-user"><strong>{user.name}</strong><span>{user.role}</span><button className="text-button" onClick={onLogout}>Đăng xuất</button></div>
    </aside>
    <div className="workspace">
      <header className="top-header"><button className="menu-button" aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen((value) => !value)}>Menu</button><div><strong>Bright Tùng Phát Admin</strong><span>{lightCmsUiCopy.headerSubtitle}</span></div></header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
